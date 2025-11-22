import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const propertyId = Deno.env.get('GOOGLE_ANALYTICS_PROPERTY_ID');
    const credentials = Deno.env.get('GOOGLE_ANALYTICS_CREDENTIALS');

    if (!propertyId || !credentials) {
      console.error('Missing Google Analytics credentials');
      return new Response(
        JSON.stringify({ error: 'Google Analytics credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { startDate, endDate, metrics = ['sessions', 'users', 'newUsers'] } = await req.json();

    // Parse credentials JSON
    let credentialsObj;
    try {
      credentialsObj = JSON.parse(credentials);
    } catch (e) {
      console.error('Failed to parse credentials:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OAuth2 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(credentialsObj),
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get access token:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Google Analytics' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Fetch analytics data
    const analyticsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: startDate || '30daysAgo', endDate: endDate || 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: metrics.map((m: string) => ({ name: m })),
          dimensionFilter: {
            filter: {
              fieldName: 'sessionSource',
              inListFilter: {
                values: ['google', 'bing', 'yahoo', 'duckduckgo'],
              },
            },
          },
        }),
      }
    );

    if (!analyticsResponse.ok) {
      const errorText = await analyticsResponse.text();
      console.error('Failed to fetch analytics data:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const analyticsData = await analyticsResponse.json();

    // Transform data to match our interface
    const searchEngineData = transformAnalyticsData(analyticsData);

    return new Response(
      JSON.stringify(searchEngineData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in google-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(signature);
  return `${signatureInput}.${encodedSignature}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function transformAnalyticsData(data: any): any {
  const rows = data.rows || [];
  const totalSessions = rows.reduce((sum: number, row: any) => sum + parseInt(row.metricValues[0].value), 0);

  const searchEngines = rows.map((row: any) => {
    const source = row.dimensionValues[0].value.toLowerCase();
    const sessions = parseInt(row.metricValues[0].value);
    const percentage = totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0;

    let name = 'Other';
    let icon = '🔍';

    if (source.includes('google')) {
      name = 'Google';
      icon = '🔍';
    } else if (source.includes('bing')) {
      name = 'Bing';
      icon = '🅱️';
    } else if (source.includes('yahoo')) {
      name = 'Yahoo';
      icon = '⚪';
    } else if (source.includes('duckduckgo')) {
      name = 'DuckDuckGo';
      icon = '🦆';
    }

    return {
      name,
      icon,
      referrals: sessions,
      percentage,
      trend: 'stable' as const,
    };
  });

  return {
    searchEngines,
    totalReferrals: totalSessions,
  };
}
