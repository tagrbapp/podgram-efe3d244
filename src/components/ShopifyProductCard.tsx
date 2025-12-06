import { ShopifyProduct } from "@/lib/shopify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Pencil } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

interface Translation {
  title_ar: string | null;
  description_ar: string | null;
}

const USD_TO_SAR_RATE = 3.75;

const ShopifyProductCard = ({ product }: ShopifyProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const navigate = useNavigate();
  const { node } = product;
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const image = node.images?.edges?.[0]?.node;
  const price = node.priceRange?.minVariantPrice;
  const firstVariant = node.variants?.edges?.[0]?.node;

  useEffect(() => {
    const fetchData = async () => {
      // Fetch translation
      const { data: translationData } = await supabase
        .from('shopify_product_translations')
        .select('title_ar, description_ar')
        .eq('product_handle', node.handle)
        .maybeSingle();
      
      if (translationData) {
        setTranslation(translationData);
      }

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsAdmin(!!roleData);
      }
    };
    
    fetchData();
  }, [node.handle]);

  const displayTitle = translation?.title_ar || node.title;
  const displayDescription = translation?.description_ar || node.description;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) {
      toast.error("المنتج غير متاح حالياً");
      return;
    }

    addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    });

    toast.success("تمت الإضافة للسلة", {
      description: node.title,
      position: "top-center"
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/dashboard/shopify-products');
  };

  const formatPrice = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-US');
  };

  const priceInUSD = price ? parseFloat(price.amount) : 0;
  const priceInSAR = priceInUSD * USD_TO_SAR_RATE;

  return (
    <Link to={`/product/${node.handle}`}>
      <Card className="group overflow-hidden border-border/50 bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full relative">
        {isAdmin && (
          <Button
            onClick={handleEdit}
            size="icon"
            variant="secondary"
            className="absolute top-2 left-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        
        <div className="aspect-square relative overflow-hidden bg-muted">
          {image?.url ? (
            <img
              src={image.url}
              alt={image.altText || node.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ShoppingCart className="h-4 w-4 ml-2" />
            أضف للسلة
          </Button>
        </div>
        
        <CardContent className="p-4 text-right" dir="rtl">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          
          {displayDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {displayDescription}
            </p>
          )}
          
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-primary">
              {price ? `${formatPrice(price.amount)} ${price.currencyCode === 'SAR' ? 'ر.س' : '$'}` : 'السعر غير متوفر'}
            </span>
            
            {isAdmin && price && (
              <div className="text-xs text-muted-foreground border-t border-border/50 pt-1 mt-1">
                <span className="block">${formatPrice(priceInUSD.toFixed(2))} USD</span>
                <span className="block">{formatPrice(priceInSAR.toFixed(2))} ر.س</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ShopifyProductCard;
