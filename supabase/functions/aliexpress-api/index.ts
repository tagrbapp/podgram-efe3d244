import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALIEXPRESS_APP_KEY = Deno.env.get('ALIEXPRESS_APP_KEY');
const ALIEXPRESS_APP_SECRET = Deno.env.get('ALIEXPRESS_APP_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// AliExpress API Base URL
const ALIEXPRESS_API_URL = 'https://api-sg.aliexpress.com/sync';

// SHA-256 implementation using Web Crypto API
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Generate signature for AliExpress API using SHA-256
async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  // Sort keys alphabetically (ASCII order) as required by AliExpress
  const sortedKeys = Object.keys(params).sort();
  
  // Build sign string: secret + key1value1 + key2value2 + ... + secret
  let signStr = secret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += secret;
  
  console.log('Sign string (first 100 chars):', signStr.substring(0, 100));
  
  const signature = await sha256(signStr);
  console.log('Generated signature:', signature);
  
  return signature;
}

// Get current timestamp in milliseconds
function getTimestamp(): string {
  return Date.now().toString();
}

// Search products on AliExpress
async function searchProducts(keywords: string, categoryId?: string, page = 1, pageSize = 20) {
  console.log('Searching AliExpress products:', { keywords, categoryId, page, pageSize });
  
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.affiliate.product.query',
    format: 'json',
    v: '2.0',
    sign_method: 'sha256',
    timestamp: getTimestamp(),
    keywords: keywords,
    page_no: page.toString(),
    page_size: pageSize.toString(),
    target_currency: 'SAR',
    target_language: 'AR',
    sort: 'SALE_PRICE_ASC',
  };
  
  if (categoryId) {
    params.category_ids = categoryId;
  }
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('AliExpress API response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

// Get product details
async function getProductDetails(productIds: string[]) {
  console.log('Getting product details for:', productIds);
  
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.affiliate.productdetail.get',
    format: 'json',
    v: '2.0',
    sign_method: 'sha256',
    timestamp: getTimestamp(),
    product_ids: productIds.join(','),
    target_currency: 'SAR',
    target_language: 'AR',
  };
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('Product details response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator']);
    
    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ليس لديك صلاحية للوصول لهذه الخدمة' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log('Action:', action, 'Params:', params);

    let result;

    switch (action) {
      case 'search':
        result = await searchProducts(
          params.keywords,
          params.categoryId,
          params.page,
          params.pageSize
        );
        break;

      case 'get_details':
        result = await getProductDetails(params.productIds);
        break;

      case 'import':
        // Import product to database
        const { product, categoryId } = params;
        
        const { data: imported, error: importError } = await supabase
          .from('aliexpress_products')
          .upsert({
            aliexpress_product_id: product.product_id,
            title: product.product_title,
            title_ar: product.product_title,
            description: product.product_detail_url,
            price: parseFloat(product.target_sale_price || product.target_original_price),
            original_price: parseFloat(product.target_original_price),
            discount_percentage: product.discount ? parseInt(product.discount) : null,
            currency: 'SAR',
            images: product.product_small_image_urls?.string || [product.product_main_image_url],
            product_url: product.product_detail_url,
            category_id: categoryId,
            seller_name: product.shop_title,
            seller_rating: product.evaluate_rate ? parseFloat(product.evaluate_rate) : null,
            shipping_cost: product.shipping_price ? parseFloat(product.shipping_price) : 0,
            shipping_time: product.ship_to_days,
            imported_by: user.id,
          }, { onConflict: 'aliexpress_product_id' })
          .select()
          .single();

        if (importError) {
          console.error('Import error:', importError);
          return new Response(
            JSON.stringify({ error: 'فشل في استيراد المنتج', details: importError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { success: true, product: imported };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'إجراء غير معروف' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in aliexpress-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
