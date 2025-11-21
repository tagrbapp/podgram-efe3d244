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
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 rounded-3xl shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 animate-fade-in"
      onClick={() => navigate(`/auction/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted to-accent/5">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground shadow-elegant backdrop-blur-sm border-0 px-4 py-2 animate-pulse">
            <Gavel className="h-4 w-4 ml-1.5" />
            <span className="font-bold">مزاد مباشر</span>
          </Badge>
        </div>

        {/* Bids Counter */}
        <div className="absolute top-4 right-4 z-10">
          <div className="glass px-4 py-2 rounded-2xl shadow-elegant flex items-center gap-2 border border-border/20">
            <TrendingUp className="h-4 w-4 text-secondary animate-pulse" />
            <span className="text-sm font-bold text-foreground">{totalBids}</span>
            <span className="text-xs text-muted-foreground">عرض</span>
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
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 bg-gradient-to-b from-card to-muted/20">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm"
          >
            {category}
          </Badge>
          {status === "active" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-semibold text-secondary">نشط</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl text-foreground line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>

        {/* Price Section */}
        <div className="pt-4 border-t border-border/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">السعر الابتدائي</p>
              <p className="text-base font-bold text-foreground">
                {startingPrice.toLocaleString("en-US")} ريال
              </p>
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-muted-foreground font-medium">العرض الحالي</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {(currentBid || startingPrice).toLocaleString("en-US")} ريال
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
            <AuctionTimer endTime={endTime} />
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-gradient-to-r from-primary via-primary to-secondary hover:from-primary/90 hover:via-primary/90 hover:to-secondary/90 text-primary-foreground font-bold h-14 text-base rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-[1.02] border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${id}`);
          }}
        >
          <Gavel className="h-5 w-5 ml-2" />
          <span>المزايدة الآن</span>
        </Button>
      </div>
    </Card>
  );
};

export default AuctionCard;
