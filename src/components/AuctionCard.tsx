import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Eye, TrendingUp, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuctionTimer from "./AuctionTimer";

interface AuctionCardProps {
  id: string;
  listingId: string;
  title: string;
  currentBid: number | null;
  startingPrice: number;
  endTime: string;
  image: string;
  category: string;
  status: string;
  totalBids: number;
}

const AuctionCard = ({
  id,
  listingId,
  title,
  currentBid,
  startingPrice,
  endTime,
  image,
  category,
  status,
  totalBids,
}: AuctionCardProps) => {
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
      className="group relative overflow-hidden cursor-pointer bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border/40 hover:border-primary/40 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.15),0_0_40px_rgba(var(--primary-rgb),0.2)] transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] animate-fade-in before:absolute before:inset-0 before:rounded-[2rem] before:p-[2px] before:bg-gradient-to-br before:from-primary/20 before:via-transparent before:to-secondary/20 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 before:-z-10"
      onClick={() => navigate(`/auction/${id}`)}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20" />
      
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted via-accent/5 to-secondary/10">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.15] group-hover:brightness-110 group-hover:saturate-110"
        />

        {/* Status Badge */}
        <div className="absolute top-5 left-5 z-10 animate-fade-in">
          <Badge className="bg-gradient-to-r from-primary via-primary/95 to-secondary text-primary-foreground shadow-[0_4px_20px_rgba(var(--primary-rgb),0.4)] backdrop-blur-md border border-primary-foreground/20 px-5 py-2.5 rounded-2xl animate-pulse hover:scale-105 transition-transform duration-300">
            <Gavel className="h-4 w-4 ml-2" />
            <span className="font-bold text-sm">مزاد مباشر</span>
          </Badge>
        </div>

        {/* Bids Counter */}
        <div className="absolute top-5 right-5 z-10 animate-fade-in">
          <div className="glass px-5 py-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-2.5 border border-border/30 backdrop-blur-xl bg-card/95 hover:scale-105 transition-all duration-300">
            <TrendingUp className="h-4 w-4 text-secondary animate-pulse" />
            <span className="text-base font-bold text-foreground">{totalBids}</span>
            <span className="text-sm text-muted-foreground font-medium">عرض</span>
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
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-7 space-y-5 bg-gradient-to-b from-card via-card to-muted/30 relative">
        {/* Decorative Corner Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[3rem] pointer-events-none" />
        
        {/* Category Badge */}
        <div className="flex items-center gap-2.5 relative z-10">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-primary/15 to-primary/10 text-primary hover:from-primary/25 hover:to-primary/20 border border-primary/20 text-sm font-bold px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            {category}
          </Badge>
          {status === "active" && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-secondary/15 to-secondary/10 border border-secondary/20 hover:scale-105 transition-transform duration-300">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary-rgb),0.6)] animate-pulse" />
              <span className="text-sm font-bold text-secondary">نشط</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl text-foreground line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-primary transition-all duration-300 group-hover:translate-x-1 relative z-10">
          {title}
        </h3>

        {/* Price Section */}
        <div className="pt-5 border-t-2 border-border/40 space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30 hover:border-border/50 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">السعر الابتدائي</p>
              <p className="text-lg font-bold text-foreground">
                {startingPrice.toLocaleString("en-US")} <span className="text-sm font-medium">ر.س</span>
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-2 border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide text-left">العرض الحالي</p>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-secondary text-left animate-pulse">
                {(currentBid || startingPrice).toLocaleString("en-US")} <span className="text-base">ر.س</span>
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-gradient-to-br from-muted/60 to-muted/40 rounded-2xl p-4 border-2 border-border/40 shadow-inner backdrop-blur-sm">
            <AuctionTimer endTime={endTime} auctionId={id} />
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-gradient-to-r from-primary via-primary to-secondary hover:from-primary hover:via-primary/95 hover:to-secondary/95 text-primary-foreground font-bold h-16 text-lg rounded-2xl shadow-[0_10px_40px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_15px_50px_rgba(var(--primary-rgb),0.4)] transition-all duration-500 hover:scale-[1.03] border-0 relative overflow-hidden group/btn active:scale-95 relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${id}`);
          }}
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Gavel className="h-6 w-6 ml-2.5 group-hover/btn:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">المزايدة الآن</span>
        </Button>
      </div>
    </Card>
  );
};

export default AuctionCard;
