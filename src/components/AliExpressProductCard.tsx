import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Star, TrendingDown, Eye } from "lucide-react";

interface AliExpressProductCardProps {
  id: string;
  title: string;
  titleAr?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  productUrl: string;
  sellerRating?: number;
  shippingCost?: number;
  shippingTime?: string;
  currency?: string;
}

const AliExpressProductCard = ({
  id,
  title,
  titleAr,
  price,
  originalPrice,
  discountPercentage,
  images,
  productUrl,
  sellerRating,
  shippingCost,
  shippingTime,
  currency = "SAR",
}: AliExpressProductCardProps) => {
  const navigate = useNavigate();
  const displayTitle = titleAr || title;
  const hasDiscount = discountPercentage && discountPercentage > 0;

  const handleClick = () => {
    navigate(`/aliexpress-product/${id}`);
  };

  return (
    <Card 
      className="group overflow-hidden rounded-3xl border-0 bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={images?.[0] || "/placeholder.svg"}
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground gap-1">
            <TrendingDown className="w-3 h-3" />
            {discountPercentage}%-
          </Badge>
        )}

        {/* AliExpress Badge */}
        <Badge className="absolute top-3 left-3 bg-[#FF6A00] text-white">
          AliExpress
        </Badge>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Action */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          عرض التفاصيل
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 text-right min-h-[2.5rem]">
          {displayTitle}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">
              {price.toLocaleString("en-US")}
            </span>
            <span className="text-sm text-muted-foreground">{currency}</span>
          </div>
          {hasDiscount && originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {originalPrice.toLocaleString("en-US")}
            </span>
          )}
        </div>

        {/* Seller Rating & Shipping */}
        <div className="flex items-center justify-between text-xs text-muted-foreground" dir="rtl">
          {sellerRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{sellerRating.toFixed(1)}</span>
            </div>
          )}
          {shippingTime && (
            <div className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span>{shippingTime}</span>
            </div>
          )}
        </div>

        {/* Free Shipping Badge */}
        {shippingCost === 0 && (
          <Badge variant="secondary" className="text-xs">
            شحن مجاني
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default AliExpressProductCard;
