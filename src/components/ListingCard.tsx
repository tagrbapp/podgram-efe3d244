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
      className="group relative overflow-hidden cursor-pointer bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border/40 hover:border-secondary/40 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.15),0_0_40px_rgba(var(--secondary-rgb),0.2)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] animate-fade-in before:absolute before:inset-0 before:rounded-[2rem] before:p-[2px] before:bg-gradient-to-br before:from-secondary/20 before:via-transparent before:to-accent/20 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 before:-z-10"
      onClick={() => navigate(`/listing/${id}`)}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20" />
      
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted via-secondary/5 to-accent/10">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.15] group-hover:brightness-110 group-hover:saturate-110"
        />

        {/* Quick Actions - Top Left */}
        <div className="absolute top-5 left-5 z-10 flex gap-2.5 animate-fade-in">
          <div className="glass h-12 w-12 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border/30 hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--secondary-rgb),0.4)] transition-all duration-300 backdrop-blur-xl bg-card/95 group/icon">
            <TrendingUp className="h-5 w-5 text-secondary group-hover/icon:scale-110 transition-transform duration-300" />
          </div>
          <div className="glass h-12 w-12 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border/30 hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] transition-all duration-300 backdrop-blur-xl bg-card/95 group/icon">
            <Clock className="h-5 w-5 text-primary group-hover/icon:scale-110 transition-transform duration-300" />
          </div>
        </div>

        {/* Info Badges - Top Right */}
        <div className="absolute top-5 right-5 z-10 flex flex-col gap-2.5 animate-fade-in">
          <div className="glass px-5 py-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-2.5 border border-border/30 backdrop-blur-xl bg-card/95 hover:scale-105 transition-all duration-300">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{time}</span>
          </div>
          <div className="glass px-5 py-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-2.5 border border-border/30 backdrop-blur-xl bg-card/95 hover:scale-105 transition-all duration-300">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">312</span>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className="absolute bottom-5 right-5 z-10 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 glass hover:scale-110 hover:shadow-[0_8px_30px_rgba(239,68,68,0.3)] border border-border/30 backdrop-blur-xl bg-card/95 group/fav"
        >
          <Heart
            className={`h-6 w-6 transition-all duration-300 ${
              isFavorite ? "fill-red-500 text-red-500 scale-110 animate-pulse" : "text-muted-foreground group-hover/fav:text-red-500 group-hover/fav:scale-110"
            }`}
          />
        </button>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-secondary/30 via-secondary/10 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-7 space-y-5 bg-gradient-to-b from-card via-card to-muted/30 relative">
        {/* Decorative Corner Gradient */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-bl from-secondary/5 to-transparent rounded-br-[3rem] pointer-events-none" />
        
        {/* Category & Location */}
        <div className="flex items-center justify-between gap-2.5 relative z-10">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-secondary/15 to-secondary/10 text-secondary hover:from-secondary/25 hover:to-secondary/20 border border-secondary/20 text-sm font-bold px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            {category}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border/30">
            <span className="font-semibold">{location}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl text-foreground line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-secondary transition-all duration-300 group-hover:translate-x-1 relative z-10">
          {title}
        </h3>

        {/* Featured Badge */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 hover:scale-105 transition-transform duration-300 shadow-sm">
            <TrendingUp className="h-4 w-4 text-accent-foreground" />
            <span className="text-sm font-bold text-accent-foreground">متميز</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="pt-5 border-t-2 border-border/40 space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">السعر الابتدائي</p>
              <p className="text-lg font-bold text-primary">
                {(price * 0.95).toLocaleString("en-US")} <span className="text-sm font-medium">ر.س</span>
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-br from-secondary/10 via-secondary/5 to-accent/10 border-2 border-secondary/30 hover:border-secondary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--secondary-rgb),0.2)]">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide text-left">السعر الحالي</p>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary to-accent text-left">
                {price.toLocaleString("en-US")} <span className="text-base">ر.س</span>
              </p>
            </div>
          </div>
          
          {/* Growth Indicator */}
          <div className="flex items-center justify-end gap-2 px-4 py-2 bg-gradient-to-r from-secondary/15 to-secondary/10 rounded-full w-fit ml-auto border border-secondary/20 hover:scale-105 transition-transform duration-300 shadow-sm">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <span className="text-base font-bold text-secondary">+2.2%</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-gradient-to-r from-secondary via-secondary to-accent hover:from-secondary hover:via-secondary/95 hover:to-accent/95 text-secondary-foreground font-bold h-16 text-lg rounded-2xl shadow-[0_10px_40px_rgba(var(--secondary-rgb),0.25)] hover:shadow-[0_15px_50px_rgba(var(--secondary-rgb),0.4)] transition-all duration-500 hover:scale-[1.03] border-0 relative overflow-hidden group/btn active:scale-95 relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/listing/${id}`);
          }}
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <TrendingUp className="h-6 w-6 ml-2.5 group-hover/btn:scale-110 transition-transform duration-300" />
          <span className="relative z-10">عرض التفاصيل</span>
        </Button>
      </div>
    </Card>
  );
};

export default ListingCard;
