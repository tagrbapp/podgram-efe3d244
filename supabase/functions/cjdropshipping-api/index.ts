import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and has admin/moderator role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator'])
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - يجب أن تكون مشرفًا' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = await req.json();
    console.log(`CJdropshipping API action: ${action}`, params);

    const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
    const CJ_EMAIL = Deno.env.get('CJ_EMAIL');

    // Check if API keys are configured
    if (!CJ_API_KEY && action !== 'import') {
      return new Response(
        JSON.stringify({ 
          error: 'لم يتم تكوين مفاتيح API الخاصة بـ CJdropshipping',
          needsConfig: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'search': {
        // Search products from CJdropshipping
        const { keywords, categoryId, page = 1, pageSize = 20 } = params;
        
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': CJ_API_KEY!,
          },
          body: JSON.stringify({
            productNameEn: keywords,
            categoryId: categoryId || undefined,
            pageNum: page,
            pageSize: pageSize,
          }),
        });

        const data = await response.json();
        console.log('CJ Search response:', JSON.stringify(data).substring(0, 500));
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_details': {
        // Get product details
        const { productId } = params;
        
        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
          method: 'GET',
          headers: {
            'CJ-Access-Token': CJ_API_KEY!,
          },
        });

        const data = await response.json();
        console.log('CJ Details response:', JSON.stringify(data).substring(0, 500));
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_categories': {
        // Get CJdropshipping categories
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
          method: 'GET',
          headers: {
            'CJ-Access-Token': CJ_API_KEY!,
          },
        });

        const data = await response.json();
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import': {
        // Import product to local database
        const { product, categoryId } = params;
        
        const productData = {
          cj_product_id: product.pid || product.product_id || String(Date.now()),
          title: product.productNameEn || product.title || `منتج CJ #${product.pid}`,
          title_ar: product.title_ar || product.productNameEn || product.title,
          description: product.description || product.productDescEn || '',
          description_ar: product.description_ar || null,
          price: parseFloat(product.sellPrice || product.price || 0),
          original_price: parseFloat(product.productPrice || product.original_price || 0),
          discount_percentage: product.discount_percentage || null,
          currency: 'SAR',
          images: product.productImage ? [product.productImage] : (product.images || []),
          product_url: product.productUrl || `https://cjdropshipping.com/product/${product.pid}`,
          category_id: categoryId || null,
          seller_name: 'CJdropshipping',
          seller_rating: product.rating || null,
          shipping_cost: parseFloat(product.shippingPrice || 0),
          shipping_time: product.deliveryDays ? `${product.deliveryDays} أيام` : null,
          stock_quantity: parseInt(product.stock || 0),
          is_active: true,
          imported_by: user.id,
        };

        const { data: insertedProduct, error: insertError } = await supabaseClient
          .from('cjdropshipping_products')
          .upsert(productData, { onConflict: 'cj_product_id' })
          .select()
          .single();

        if (insertError) {
          console.error('Import error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: insertError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Product imported successfully:', insertedProduct.id);
        return new Response(
          JSON.stringify({ success: true, product: insertedProduct }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'إجراء غير معروف' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('CJdropshipping API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
