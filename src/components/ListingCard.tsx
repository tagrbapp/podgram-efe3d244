import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Eye, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  time: string;
  image: string;
  category: string;
}

const ListingCard = ({ id, title, price, location, time, image, category }: ListingCardProps) => {
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
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 rounded-3xl shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 animate-fade-in"
      onClick={() => navigate(`/listing/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted to-secondary/5">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        {/* Quick Actions - Top Left */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="glass h-11 w-11 rounded-full flex items-center justify-center shadow-elegant border border-border/20 hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <div className="glass h-11 w-11 rounded-full flex items-center justify-center shadow-elegant border border-border/20 hover:scale-110 transition-transform duration-300">
            <Clock className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Info Badges - Top Right */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="glass px-4 py-2 rounded-2xl shadow-elegant flex items-center gap-2 border border-border/20">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{time}</span>
          </div>
          <div className="glass px-4 py-2 rounded-2xl shadow-elegant flex items-center gap-2 border border-border/20">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">312</span>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 glass hover:scale-110 hover:shadow-elegant border border-border/20"
        >
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"
            }`}
          />
        </button>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-secondary/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 bg-gradient-to-b from-card to-muted/20">
        {/* Category & Location */}
        <div className="flex items-center justify-between gap-2">
          <Badge 
            variant="secondary" 
            className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-0 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm"
          >
            {category}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{location}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl text-foreground line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-secondary transition-colors duration-300">
          {title}
        </h3>

        {/* Featured Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 border border-accent">
            <TrendingUp className="h-3.5 w-3.5 text-accent-foreground" />
            <span className="text-xs font-semibold text-accent-foreground">متميز</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">السعر الابتدائي</p>
              <p className="text-lg font-bold text-primary">
                {(price * 0.95).toLocaleString("en-US")} ₽
              </p>
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-muted-foreground font-medium">السعر الحالي</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
                {price.toLocaleString("en-US")} ₽
              </p>
            </div>
          </div>
          
          {/* Growth Indicator */}
          <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-full w-fit ml-auto">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            <span className="text-sm font-bold text-secondary">+2.2%</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-gradient-to-r from-secondary via-secondary to-accent hover:from-secondary/90 hover:via-secondary/90 hover:to-accent/90 text-secondary-foreground font-bold h-14 text-base rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-[1.02] border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/listing/${id}`);
          }}
        >
          <TrendingUp className="h-5 w-5 ml-2" />
          <span>عرض التفاصيل</span>
        </Button>
      </div>
    </Card>
  );
};

export default ListingCard;
