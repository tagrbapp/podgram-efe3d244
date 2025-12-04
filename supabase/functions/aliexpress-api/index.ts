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

// HMAC-SHA256 implementation using Web Crypto API
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Generate signature for AliExpress API using HMAC-SHA256
async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  
  console.log('Sign string (first 100 chars):', signStr.substring(0, 100));
  const signature = await hmacSha256(signStr, secret);
  console.log('Generated HMAC-SHA256 signature:', signature);
  
  return signature;
}

// Get current timestamp in milliseconds
function getTimestamp(): string {
  return Date.now().toString();
}

// Get available feed names
async function getFeedNames() {
  console.log('Getting available feed names...');
  
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.ds.feedname.get',
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    timestamp: getTimestamp(),
  };
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('Feed names response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

// Search products using DS Feed API with proper feed names
async function searchProducts(keywords: string, categoryId?: string, page = 1, pageSize = 20) {
  console.log('Searching AliExpress DS products:', { keywords, categoryId, page, pageSize });
  
  // DS Feed API with proper feed name
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.ds.recommend.feed.get',
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    timestamp: getTimestamp(),
    country: 'SA',
    target_currency: 'SAR',
    target_language: 'AR',
    page_no: page.toString(),
    page_size: pageSize.toString(),
    sort: 'SALE_PRICE_ASC',
  };
  
  // Use proper feed names - these are the standard DS Center feed names
  // DS Center provides feeds like: DS_CHOICE, plus_tag, realtime_tag, etc.
  // If keywords match a category, we'll filter later
  params.feed_name = 'DS_HOT_PRODUCTS';
  
  // Add category filter if provided and it's an AliExpress category ID (numeric)
  if (categoryId && /^\d+$/.test(categoryId)) {
    params.category_ids = categoryId;
  }
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  console.log('DS Feed API Request URL:', `${ALIEXPRESS_API_URL}?${queryString.substring(0, 250)}...`);
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('AliExpress DS Feed API response:', JSON.stringify(data).substring(0, 500));
  
  // If DS Feed API returns products, filter by keywords client-side if needed
  if (data.aliexpress_ds_recommend_feed_get_response?.result?.products?.product) {
    const products = data.aliexpress_ds_recommend_feed_get_response.result.products.product;
    
    // Filter by keywords if provided (case-insensitive)
    if (keywords && keywords.trim()) {
      const lowerKeywords = keywords.toLowerCase();
      const filteredProducts = products.filter((p: any) => 
        p.product_title?.toLowerCase().includes(lowerKeywords) ||
        p.second_level_category_name?.toLowerCase().includes(lowerKeywords) ||
        p.first_level_category_name?.toLowerCase().includes(lowerKeywords)
      );
      
      data.aliexpress_ds_recommend_feed_get_response.result.products.product = filteredProducts;
      data.aliexpress_ds_recommend_feed_get_response.result.current_record_count = filteredProducts.length;
    }
    
    return data;
  }
  
  // If DS Feed API fails, try getting categories or feed names
  if (data.error_response) {
    console.log('DS Feed API error:', data.error_response);
    
    // Try to get feed names first to understand what's available
    const feedNamesResult = await getFeedNames();
    console.log('Available feeds:', JSON.stringify(feedNamesResult).substring(0, 500));
    
    // Try with different feed name
    return await tryAlternativeFeed(categoryId, page, pageSize);
  }
  
  return data;
}

// Try alternative feed names
async function tryAlternativeFeed(categoryId?: string, page = 1, pageSize = 20) {
  console.log('Trying alternative feed...');
  
  // Try DS_CHOICE feed
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.ds.recommend.feed.get',
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    timestamp: getTimestamp(),
    country: 'SA',
    target_currency: 'SAR',
    target_language: 'AR',
    page_no: page.toString(),
    page_size: pageSize.toString(),
  };
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('Alternative feed response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

// Get AliExpress categories
async function getCategories() {
  console.log('Getting AliExpress categories...');
  
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.ds.category.get',
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    timestamp: getTimestamp(),
  };
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('Categories response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

// Get product details using DS API
async function getProductDetails(productIds: string[]) {
  console.log('Getting DS product details for:', productIds);
  
  const params: Record<string, string> = {
    app_key: ALIEXPRESS_APP_KEY!,
    method: 'aliexpress.ds.product.get',
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    timestamp: getTimestamp(),
    product_id: productIds[0], // DS API takes single product ID
    ship_to_country: 'SA',
    target_currency: 'SAR',
    target_language: 'AR',
  };
  
  params.sign = await generateSignature(params, ALIEXPRESS_APP_SECRET!);
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`);
  const data = await response.json();
  
  console.log('DS Product details response:', JSON.stringify(data).substring(0, 500));
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

      case 'get_categories':
        result = await getCategories();
        break;

      case 'get_feeds':
        result = await getFeedNames();
        break;

      case 'import':
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
