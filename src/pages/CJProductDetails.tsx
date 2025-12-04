import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CJProductCard } from "@/components/CJProductCard";
import { 
  Package, 
  ExternalLink, 
  Truck, 
  Clock, 
  ChevronRight,
  ShoppingCart,
  Star
} from "lucide-react";

export default function CJProductDetails() {
  const { id } = useParams<{ id: string }>();

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['cj-product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cjdropshipping_products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch similar products
  const { data: similarProducts } = useQuery({
    queryKey: ['cj-similar-products', product?.category_id, id],
    queryFn: async () => {
      let query = supabase
        .from('cjdropshipping_products')
        .select('*')
        .eq('is_active', true)
        .neq('id', id!)
        .limit(4);
      
      if (product?.category_id) {
        query = query.eq('category_id', product.category_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // If no products in same category, get any products
      if (data.length === 0 && product?.category_id) {
        const { data: anyProducts } = await supabase
          .from('cjdropshipping_products')
          .select('*')
          .eq('is_active', true)
          .neq('id', id!)
          .limit(4);
        return anyProducts || [];
      }
      
      return data;
    },
    enabled: !!product && !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">المنتج غير موجود</h1>
          <p className="text-muted-foreground mb-4">لم يتم العثور على المنتج المطلوب</p>
          <Link to="/cj-catalog">
            <Button>العودة إلى الكتالوج</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const mainImage = product.images?.[0] || '/placeholder.svg';
  const displayTitle = product.title_ar || product.title;
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/cj-catalog" className="hover:text-primary">منتجات CJ</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground line-clamp-1">{displayTitle}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <img
                src={mainImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-orange-500">
                <Package className="w-4 h-4 ml-1" />
                CJdropshipping
              </Badge>
              {hasDiscount && product.discount_percentage && (
                <Badge variant="destructive" className="absolute top-4 left-4">
                  خصم {product.discount_percentage}%
                </Badge>
              )}
            </div>
            
            {/* Additional Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {(product.categories as any)?.name && (
              <Badge variant="secondary">
                {(product.categories as any).name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold">{displayTitle}</h1>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {product.price.toLocaleString('en-US')} ر.س
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.original_price?.toLocaleString('en-US')} ر.س
                  </span>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">تكلفة الشحن</p>
                    <p className="text-sm text-muted-foreground">
                      {product.shipping_cost === 0 ? 'مجاني' : `${product.shipping_cost?.toLocaleString('en-US')} ر.س`}
                    </p>
                  </div>
                </div>
                {product.shipping_time && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">وقت التوصيل</p>
                      <p className="text-sm text-muted-foreground">{product.shipping_time}</p>
                    </div>
                  </div>
                )}
                {product.seller_rating && (
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">تقييم البائع</p>
                      <p className="text-sm text-muted-foreground">{product.seller_rating} / 5</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => window.open(product.product_url, '_blank')}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                طلب من CJdropshipping
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open(product.product_url, '_blank')}
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h2 className="font-semibold">الوصف</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description_ar || product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">منتجات مشابهة</h2>
              <Link to="/cj-catalog" className="text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map((p: any) => (
                <CJProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
