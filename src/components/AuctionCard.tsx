import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Eye, TrendingUp, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuctionTimer from "./AuctionTimer";
import CollectionTags from "./CollectionTags";

interface AuctionCardProps {
  id: string;
  listingId: string;
  title: string;
  description?: string;
  currentBid: number | null;
  startingPrice: number;
  endTime: string;
  image: string;
  homepageImage?: string | null;
  category: string;
  status: string;
  totalBids: number;
  season?: string;
  condition?: string;
  conditionRating?: number;
  isTrending?: boolean;
  tags?: string[];
}

const AuctionCard = ({
  id,
  listingId,
  title,
  description,
  currentBid,
  startingPrice,
  endTime,
  image,
  homepageImage,
  category,
  status,
  totalBids,
  season,
  condition = 'new',
  conditionRating,
  isTrending,
  tags,
}: AuctionCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Use homepage image if available, otherwise fall back to first image
  const displayImage = homepageImage || image;

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول لإضافة المفضلة");
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("تم الإزالة من المفضلة");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, listing_id: listingId });

        if (error) throw error;
        setIsFavorite(true);
        toast.success("تم الإضافة للمفضلة");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("فشل في تحديث المفضلة");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 hover:border-primary/40 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => navigate(`/auction/${id}`)}
      dir="rtl"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/20">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Icons Row */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between z-10">
          {/* Left Icons */}
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
            >
              <Heart
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </button>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-secondary/95 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>

          {/* Right Info */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                {new Date(endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs font-semibold text-foreground">{totalBids}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3">
        {/* Brand & Title */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <Badge variant="secondary" className="bg-muted text-foreground text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              {category}
            </Badge>
            {/* Collection Tags */}
            <CollectionTags 
              season={season}
              condition={condition}
              conditionRating={conditionRating}
              isTrending={isTrending}
              tags={tags}
              compact
            />
          </div>
          
          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>
          
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">السعر الابتدائي</p>
            <p className="text-xs sm:text-sm font-bold text-primary">
              {startingPrice.toLocaleString("en-US")} ر.س
            </p>
          </div>
          
          <div className="space-y-0.5 text-left">
            <p className="text-[10px] sm:text-xs text-muted-foreground">العرض الحالي</p>
            <p className="text-sm sm:text-lg font-bold text-foreground">
              {(currentBid || startingPrice).toLocaleString("en-US")} ر.س
            </p>
          </div>
        </div>

        {/* Growth Percentage */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-secondary">
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="text-xs sm:text-sm font-semibold">
            {currentBid ? ((currentBid - startingPrice) / startingPrice * 100).toFixed(1) : '0.0'}%
          </span>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 sm:h-12 text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${id}`);
          }}
        >
          تقديم عرض
        </Button>
      </div>
    </Card>
  );
};

export default AuctionCard;
