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
      className="overflow-hidden cursor-pointer transition-smooth hover:shadow-hover hover:-translate-y-1 bg-white border border-gray-200 hover:border-qultura-blue group"
      onClick={() => navigate(`/listing/${id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
        />

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-qultura-blue">{category}</span>
        </div>

        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className={`absolute top-3 left-3 h-9 w-9 rounded-full flex items-center justify-center transition-smooth shadow-md
            ${isFavorite ? "bg-red-500" : "bg-white hover:bg-gray-50"}
          `}
        >
          <Heart
            className={`h-4 w-4 transition-smooth ${
              isFavorite ? "fill-white text-white" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-1">
          {title}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-2xl font-bold text-qultura-blue">
            {price.toLocaleString("ar-SA")}
          </p>
          <span className="text-sm text-gray-600">ريال</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
          <span className="text-xs text-gray-400">{time}</span>
        </div>
      </div>
    </Card>
  );
};

export default ListingCard;
