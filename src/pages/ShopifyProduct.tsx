import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Package, 
  ChevronRight, 
  ChevronLeft,
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RotateCcw,
  Heart,
  Share2,
  Star,
  Check,
  ZoomIn
} from "lucide-react";
import { fetchProductByHandle, fetchShopifyProducts, ShopifyProduct as ShopifyProductType } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { trackProductEvent } from "@/lib/shopifyAnalytics";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import ImageLightbox from "@/components/ImageLightbox";
import { supabase } from "@/integrations/supabase/client";

interface VariantImage {
  url: string;
  altText: string | null;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        image?: VariantImage | null;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
      };
    }>;
  };
  options: Array<{
    name: string;
    values: string[];
  }>;
}

interface TranslatedContent {
  title_ar: string;
  description_ar: string;
}

const ShopifyProduct = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProductType[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [translation, setTranslation] = useState<TranslatedContent | null>(null);
  const [translating, setTranslating] = useState(false);
  
  const addItem = useCartStore(state => state.addItem);

  // Load or translate product content
  const loadOrTranslateProduct = async (productHandle: string, title: string, description: string, productId: string) => {
    setTranslating(true);
    try {
      // First, check if translation exists in database
      const { data: existingTranslation, error: fetchError } = await supabase
        .from('shopify_product_translations')
        .select('*')
        .eq('product_handle', productHandle)
        .single();
      
      if (existingTranslation && !fetchError) {
        // Use existing translation
        setTranslation({
          title_ar: existingTranslation.title_ar || '',
          description_ar: existingTranslation.description_ar || ''
        });
        setTranslating(false);
        return;
      }
      
      // No translation exists, call AI to translate
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ title, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTranslation(data);
        
        // Save translation to database for future use
        await supabase
          .from('shopify_product_translations')
          .insert({
            product_handle: productHandle,
            product_id: productId,
            title_original: title,
            title_ar: data.title_ar,
            description_original: description,
            description_ar: data.description_ar
          });
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      setLoading(true);
      setTranslation(null);
      const data = await fetchProductByHandle(handle);
      setProduct(data);
      
      // Set initial variant and options
      if (data?.variants?.edges?.[0]) {
        setSelectedVariant(data.variants.edges[0].node.id);
        const initialOptions: Record<string, string> = {};
        data.variants.edges[0].node.selectedOptions?.forEach(opt => {
          initialOptions[opt.name] = opt.value;
        });
        setSelectedOptions(initialOptions);
      }
      
      // Load related products
      const allProducts = await fetchShopifyProducts(8);
      setRelatedProducts(allProducts.filter(p => p.node.handle !== handle).slice(0, 4));
      
      setLoading(false);
      
      // Track product view
      if (data) {
        trackProductEvent({
          product_id: data.id,
          product_handle: handle,
          event_type: 'view',
        });
        
        // Load or translate product
        if (data.title || data.description) {
          loadOrTranslateProduct(handle, data.title || '', data.description || '', data.id);
        }
      }
    };
    loadProduct();
    window.scrollTo(0, 0);
  }, [handle]);

  // Update selected variant and image when options change
  useEffect(() => {
    if (!product) return;
    
    const matchingVariant = product.variants.edges.find(v => {
      return v.node.selectedOptions?.every(opt => selectedOptions[opt.name] === opt.value);
    });
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.node.id);
      
      // Update image to variant image if available
      if (matchingVariant.node.image?.url) {
        const variantImageUrl = matchingVariant.node.image.url;
        const imageIndex = product.images.edges.findIndex(
          img => img.node.url === variantImageUrl
        );
        if (imageIndex !== -1) {
          setSelectedImage(imageIndex);
        } else {
          // If variant image not in main images, set to first
          setSelectedImage(0);
        }
      }
    }
  }, [selectedOptions, product]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const variant = product.variants.edges.find(v => v.node.id === selectedVariant)?.node;
    if (!variant) return;

    addItem({
      product: { node: product },
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity,
      selectedOptions: variant.selectedOptions || []
    });

    toast.success("تمت الإضافة للسلة", {
      description: `${product.title} × ${quantity}`,
      position: "top-center"
    });
  };

  const formatPrice = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-US');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  const nextImage = () => {
    if (product?.images?.edges) {
      setSelectedImage((prev) => (prev + 1) % product.images.edges.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.edges) {
      setSelectedImage((prev) => (prev - 1 + product.images.edges.length) % product.images.edges.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-3xl" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-20 h-20 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <Package className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3">المنتج غير موجود</h1>
          <p className="text-muted-foreground mb-8 text-lg">عذراً، لم نتمكن من إيجاد هذا المنتج</p>
          <Button asChild size="lg">
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images?.edges || [];
  const currentVariant = product.variants.edges.find(v => v.node.id === selectedVariant)?.node;
  const imageUrls = images.map(img => img.node.url);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${product.title} | Podgram`}
        description={product.description || `اشتري ${product.title} من Podgram`}
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4" />
          <Link to="/catalog?tab=shopify" className="hover:text-primary transition-colors">المتجر</Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground font-medium">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative group">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-xl">
                {images[selectedImage]?.node.url ? (
                  <img
                    src={images[selectedImage].node.url}
                    alt={images[selectedImage].node.altText || product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-32 w-32 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={prevImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={nextImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </>
              )}
              
              {/* Zoom Button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={() => setLightboxOpen(true)}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === idx 
                        ? 'border-primary ring-2 ring-primary/20 scale-105' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={img.node.url}
                      alt={img.node.altText || `صورة ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Title & Actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Arabic Title */}
                {translation?.title_ar && (
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
                    {translation.title_ar}
                  </h1>
                )}
                {/* English Title */}
                <p className={`${translation?.title_ar ? 'text-lg text-muted-foreground' : 'text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight'}`}>
                  {product.title}
                </p>
                {translating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    جاري الترجمة...
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm">(5.0)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full ${isFavorite ? 'text-red-500 border-red-500' : ''}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {currentVariant ? formatPrice(currentVariant.price.amount) : formatPrice(product.priceRange.minVariantPrice.amount)}
              </span>
              <span className="text-xl text-muted-foreground">ر.س</span>
              {currentVariant?.availableForSale && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0">
                  <Check className="h-3 w-3 ml-1" />
                  متوفر
                </Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            {(product.description || translation?.description_ar) && (
              <div className="space-y-3">
                {translation?.description_ar && (
                  <p className="text-foreground leading-relaxed text-base">
                    {translation.description_ar}
                  </p>
                )}
                {product.description && (
                  <p className={`leading-relaxed text-base ${translation?.description_ar ? 'text-muted-foreground text-sm' : 'text-muted-foreground'}`}>
                    {product.description}
                  </p>
                )}
              </div>
            )}

            {/* Variants */}
            {product.options && product.options.length > 0 && product.options[0].name !== 'Title' && (
              <div className="space-y-5">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      {option.name}: <span className="text-primary">{selectedOptions[option.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value}
                          onClick={() => handleOptionChange(option.name, value)}
                          className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all duration-200 ${
                            selectedOptions[option.name] === value
                              ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">الكمية</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none h-12 w-12"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none h-12 w-12"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-muted-foreground text-sm">
                  الإجمالي: <span className="font-bold text-foreground">
                    {currentVariant ? formatPrice((parseFloat(currentVariant.price.amount) * quantity).toString()) : '0'} ر.س
                  </span>
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={!currentVariant?.availableForSale}
            >
              <ShoppingCart className="h-5 w-5 ml-2" />
              {currentVariant?.availableForSale ? 'أضف للسلة' : 'غير متوفر حالياً'}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Card className="border-0 bg-muted/50">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">شحن سريع</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/50">
                <CardContent className="p-4 text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">ضمان الجودة</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/50">
                <CardContent className="p-4 text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">إرجاع سهل</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">منتجات قد تعجبك</h2>
              <Link 
                to="/catalog?tab=shopify" 
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product, index) => (
                <div 
                  key={product.node.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ShopifyProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Lightbox */}
      <ImageLightbox
        images={imageUrls}
        initialIndex={selectedImage}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default ShopifyProduct;
