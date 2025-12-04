import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import AliExpressProductCard from "@/components/AliExpressProductCard";
import { 
  ExternalLink, 
  Star, 
  Truck, 
  TrendingDown, 
  ChevronRight, 
  ChevronLeft,
  ShoppingCart,
  Share2,
  Heart,
  Package
} from "lucide-react";
import { toast } from "sonner";

interface AliExpressProduct {
  id: string;
  aliexpress_product_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  product_url: string;
  seller_name: string | null;
  seller_rating: number | null;
  shipping_cost: number | null;
  shipping_time: string | null;
  currency: string | null;
  stock_quantity: number | null;
  category_id: string | null;
  categories?: { name: string } | null;
}

const AliExpressProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<AliExpressProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<AliExpressProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("aliexpress_products")
      .select(`*, categories (name)`)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("المنتج غير موجود");
      navigate("/");
      return;
    }

    setProduct(data);
    setLoading(false);
    
    // Fetch similar products
    fetchSimilarProducts(data.id, data.category_id);
  };

  const fetchSimilarProducts = async (currentId: string, categoryId: string | null) => {
    let query = supabase
      .from("aliexpress_products")
      .select(`*, categories (name)`)
      .eq("is_active", true)
      .neq("id", currentId)
      .limit(4);
    
    // If product has a category, prioritize same category
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    
    const { data } = await query.order("imported_at", { ascending: false });
    
    if (data && data.length > 0) {
      setSimilarProducts(data);
    } else if (categoryId) {
      // If no products in same category, fetch any products
      const { data: anyProducts } = await supabase
        .from("aliexpress_products")
        .select(`*, categories (name)`)
        .eq("is_active", true)
        .neq("id", currentId)
        .order("imported_at", { ascending: false })
        .limit(4);
      
      if (anyProducts) {
        setSimilarProducts(anyProducts);
      }
    }
  };

  const handlePrevImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === product.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.title_ar || product?.title,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "تم الإزالة من المفضلة" : "تم الإضافة للمفضلة");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const displayTitle = product.title_ar || product.title;
  const displayDescription = product.description_ar || product.description;
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const images = product.images || ["/placeholder.svg"];

  const breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "منتجات AliExpress", href: "/" },
    { label: displayTitle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${displayTitle} | Podgram`}
        description={displayDescription || `تسوق ${displayTitle} بأفضل الأسعار`}
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="grid lg:grid-cols-2 gap-12" dir="rtl">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-card shadow-card">
              <img
                src={images[currentImageIndex]}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              
              {/* AliExpress Badge */}
              <Badge className="absolute top-4 left-4 bg-[#FF6A00] text-white text-sm px-3 py-1">
                AliExpress
              </Badge>

              {/* Discount Badge */}
              {hasDiscount && (
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground gap-1 text-sm px-3 py-1">
                  <TrendingDown className="w-4 h-4" />
                  {product.discount_percentage}%-
                </Badge>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${displayTitle} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {displayTitle}
              </h1>
              {product.categories?.name && (
                <Badge variant="secondary" className="mt-3">
                  {product.categories.name}
                </Badge>
              )}
            </div>

            {/* Price Section */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-primary">
                    {product.price.toLocaleString("en-US")}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    {product.currency || "SAR"}
                  </span>
                </div>
                {hasDiscount && product.original_price && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg text-muted-foreground line-through">
                      {product.original_price.toLocaleString("en-US")} {product.currency || "SAR"}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      وفر {(product.original_price - product.price).toLocaleString("en-US")} {product.currency || "SAR"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller & Shipping Info */}
            <div className="grid grid-cols-2 gap-4">
              {product.seller_rating && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تقييم البائع</p>
                      <p className="font-semibold text-foreground">{product.seller_rating.toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {product.shipping_time && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">وقت التوصيل</p>
                      <p className="font-semibold text-foreground">{product.shipping_time}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Free Shipping Badge */}
            {product.shipping_cost === 0 && (
              <Badge variant="secondary" className="text-base py-2 px-4">
                <Truck className="w-4 h-4 ml-2" />
                شحن مجاني
              </Badge>
            )}

            {/* Stock Info */}
            {product.stock_quantity !== null && product.stock_quantity > 0 && (
              <p className="text-sm text-muted-foreground">
                متوفر: {product.stock_quantity.toLocaleString("en-US")} قطعة
              </p>
            )}

            {/* Description */}
            {displayDescription && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">وصف المنتج</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="flex-1 gap-2 text-lg py-6"
                asChild
              >
                <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="w-5 h-5" />
                  شراء من AliExpress
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="py-6"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="py-6"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Seller Info */}
            {product.seller_name && (
              <Card className="border-0 shadow-sm mt-6">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">البائع</p>
                  <p className="font-semibold text-foreground">{product.seller_name}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#FF6A00]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">منتجات مشابهة</h2>
                <p className="text-muted-foreground">اكتشف المزيد من المنتجات</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct, index) => (
                <div 
                  key={similarProduct.id} 
                  className="animate-scale-in hover-lift"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <AliExpressProductCard
                    id={similarProduct.id}
                    title={similarProduct.title}
                    titleAr={similarProduct.title_ar || undefined}
                    price={similarProduct.price}
                    originalPrice={similarProduct.original_price || undefined}
                    discountPercentage={similarProduct.discount_percentage || undefined}
                    images={similarProduct.images || []}
                    productUrl={similarProduct.product_url}
                    sellerRating={similarProduct.seller_rating || undefined}
                    shippingCost={similarProduct.shipping_cost || undefined}
                    shippingTime={similarProduct.shipping_time || undefined}
                    currency={similarProduct.currency || "SAR"}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AliExpressProductDetails;
