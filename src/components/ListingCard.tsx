import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Heart } from "lucide-react";
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
      className="overflow-hidden hover:shadow-glow transition-smooth cursor-pointer group border-border/30 bg-card/50 backdrop-blur-sm hover:scale-[1.02] hover:border-primary/30"
      onClick={() => navigate(`/listing/${id}`)}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
        />
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold shadow-glow-secondary">
            {category}
          </Badge>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-luxury font-bold text-lg text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full transition-smooth hover:scale-110 ${
                isFavorite 
                  ? "text-destructive hover:text-destructive" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
            >
              <Heart 
                className={`h-5 w-5 transition-all ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gradient-primary">
              {typeof price === 'number' ? price.toLocaleString('ar-SA') : price} <span className="text-sm font-normal">ر.س</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {time}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListingCard;
