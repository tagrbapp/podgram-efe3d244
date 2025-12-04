import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink } from "lucide-react";

interface CJProduct {
  id: string;
  cj_product_id: string;
  title: string;
  title_ar: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  product_url: string;
  shipping_cost: number | null;
  shipping_time: string | null;
  is_active: boolean;
}

interface CJProductCardProps {
  product: CJProduct;
}

export function CJProductCard({ product }: CJProductCardProps) {
  const displayTitle = product.title_ar || product.title;
  const mainImage = product.images?.[0] || '/placeholder.svg';
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <Link to={`/cj-product/${product.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-card">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={mainImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* CJ Badge */}
          <Badge 
            className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600"
          >
            <Package className="w-3 h-3 ml-1" />
            CJ
          </Badge>

          {/* Discount Badge */}
          {hasDiscount && product.discount_percentage && (
            <Badge 
              variant="destructive"
              className="absolute top-2 left-2"
            >
              -{product.discount_percentage}%
            </Badge>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white font-medium flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              عرض التفاصيل
            </span>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 text-right min-h-[40px]">
            {displayTitle}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.original_price?.toLocaleString('en-US')} ر.س
                </span>
              )}
              <span className="text-lg font-bold text-primary">
                {product.price.toLocaleString('en-US')} ر.س
              </span>
            </div>
            
            {product.shipping_time && (
              <span className="text-xs text-muted-foreground">
                {product.shipping_time}
              </span>
            )}
          </div>

          {/* Shipping */}
          {product.shipping_cost !== null && (
            <div className="text-xs text-muted-foreground text-right">
              الشحن: {product.shipping_cost === 0 ? 'مجاني' : `${product.shipping_cost.toLocaleString('en-US')} ر.س`}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
