import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Star, Award, TrendingUp, Phone, Mail } from "lucide-react";

interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

interface SellerStats {
  total_listings: number;
  total_sales: number;
  avg_rating: number;
  total_reviews: number;
  points: number;
  level: number;
}

interface AuctionSellerSidebarProps {
  sellerId: string;
}

const AuctionSellerSidebar = ({ sellerId }: AuctionSellerSidebarProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch seller stats
      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, status")
        .eq("user_id", sellerId);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", sellerId);

      const { data: pointsData } = await supabase
        .from("user_points")
        .select("total_points, level")
        .eq("user_id", sellerId)
        .single();

      const totalListings = listingsData?.length || 0;
      const totalSales = listingsData?.filter(l => l.status === "sold").length || 0;
      const avgRating = reviewsData?.length 
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length 
        : 0;
      const totalReviews = reviewsData?.length || 0;

      setStats({
        total_listings: totalListings,
        total_sales: totalSales,
        avg_rating: avgRating,
        total_reviews: totalReviews,
        points: pointsData?.total_points || 0,
        level: pointsData?.level || 1,
      });
    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 sticky top-4 animate-pulse">
        <div className="h-32 bg-muted rounded-lg mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card 
      className="p-6 sticky top-4 bg-gradient-to-br from-card to-muted/20 border-2 border-border/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/profile/${sellerId}`)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">معلومات البائع</h3>
          </div>
        </div>

        {/* Avatar and Name */}
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20 group-hover:border-primary/40 transition-all">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
            {profile.full_name}
          </h4>

          {stats && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                المستوى {stats.level}
              </Badge>
              {stats.avg_rating > 0 && (
                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                  <Star className="h-3 w-3 fill-current" />
                  {stats.avg_rating.toFixed(1)}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
              <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.total_listings}</p>
              <p className="text-xs text-muted-foreground">إعلان</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
              <Award className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.total_sales}</p>
              <p className="text-xs text-muted-foreground">مبيعات</p>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
              <Star className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.total_reviews}</p>
              <p className="text-xs text-muted-foreground">تقييم</p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-3 text-center border border-primary/20">
              <Award className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{stats.points}</p>
              <p className="text-xs text-muted-foreground">نقطة</p>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {profile.phone && (
          <div className="pt-4 border-t border-border/50">
            <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono text-foreground" dir="ltr">
                {profile.phone}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${sellerId}`);
          }}
        >
          <User className="h-4 w-4 ml-2" />
          عرض الملف الشخصي
        </Button>

        {/* Member Since */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            عضو منذ {new Date(profile.created_at).toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AuctionSellerSidebar;
