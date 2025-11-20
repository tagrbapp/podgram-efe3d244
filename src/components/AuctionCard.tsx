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
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:translate-y-2 bg-card border-2 border-primary/20 group"
      onClick={() => navigate(`/auction/${id}`)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute top-3 left-3">
          <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg animate-pulse">
            <Gavel className="h-3 w-3 ml-1" />
            مزاد مباشر
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-bold text-foreground">{totalBids} عرض</span>
          </div>
        </div>

        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background hover:scale-110"
        >
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      <div className="p-5 space-y-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold px-3 py-1">
          {category}
        </Badge>

        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight min-h-[3.5rem]">
          {title}
        </h3>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">السعر الابتدائي</p>
              <p className="text-base font-semibold text-foreground">
                {startingPrice.toLocaleString("ar-SA")} ₽
              </p>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground mb-1">العرض الحالي</p>
              <p className="text-xl font-bold text-primary">
                {(currentBid || startingPrice).toLocaleString("ar-SA")} ₽
              </p>
            </div>
          </div>

          <div className="mb-4">
            <AuctionTimer endTime={endTime} />
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold h-12 text-base rounded-xl shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${id}`);
          }}
        >
          <Gavel className="h-5 w-5 ml-2" />
          المزايدة الآن
        </Button>
      </div>
    </Card>
  );
};

export default AuctionCard;
