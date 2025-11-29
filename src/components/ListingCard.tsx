import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Eye, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CollectionTags from "./CollectionTags";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  time: string;
  image: string;
  category: string;
  season?: string;
  condition?: string;
  conditionRating?: number;
  isTrending?: boolean;
  tags?: string[];
}

const ListingCard = ({ 
  id, 
  title, 
  price, 
  location, 
  time, 
  image, 
  category,
  season,
  condition = 'new',
  conditionRating,
  isTrending,
  tags 
}: ListingCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
      .eq("listing_id", id)
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
          .eq("listing_id", id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("تم الإزالة من المفضلة");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, listing_id: id });

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
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 hover:border-secondary/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={() => navigate(`/listing/${id}`)}
      dir="rtl"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/20">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Icons Row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {/* Left Icons */}
          <div className="flex gap-2">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </button>
            <div className="h-10 w-10 rounded-full bg-secondary/95 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Right Info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{time}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">312</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Brand & Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="bg-muted text-foreground text-xs px-3 py-1 rounded-full">
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
          
          <h3 className="font-semibold text-base text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {location} • صيف 2024
          </p>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">السعر الابتدائي</p>
            <p className="text-sm font-bold text-primary">
              {(price * 0.95).toLocaleString("ar-SA")} ر.س
            </p>
          </div>
          
          <div className="space-y-0.5 text-left">
            <p className="text-xs text-muted-foreground">السعر الحالي</p>
            <p className="text-lg font-bold text-foreground">
              {price.toLocaleString("ar-SA")} ر.س
            </p>
          </div>
        </div>

        {/* Growth Percentage */}
        <div className="flex items-center gap-1.5 text-secondary">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-sm font-semibold">2.2%</span>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-sm rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/listing/${id}`);
          }}
        >
          عرض التفاصيل
        </Button>
      </div>
    </Card>
  );
};

export default ListingCard;
