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
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-card border border-border group"
      onClick={() => navigate(`/listing/${id}`)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 w-5 text-red-500" />
          </div>
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shadow-md">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{time}</span>
          </div>
          <div className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">312</span>
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold px-3 py-1">
            {category}
          </Badge>
        </div>

        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight min-h-[3.5rem]">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{location}</span>
          <span>•</span>
          <span>متميز</span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">السعر الابتدائي</span>
            <span className="text-xs text-muted-foreground">السعر الحالي</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-primary">
              {(price * 0.95).toLocaleString("ar-SA")} ₽
            </span>
            <span className="text-xl font-bold text-foreground">
              {price.toLocaleString("ar-SA")} ₽
            </span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">2.2%</span>
          </div>
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-12 text-base shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/listing/${id}`);
          }}
        >
          عرض السعر
        </Button>
      </div>
    </Card>
  );
};

export default ListingCard;
