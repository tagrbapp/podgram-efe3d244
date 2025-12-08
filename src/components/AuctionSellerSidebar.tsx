import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Star, 
  Award, 
  TrendingUp, 
  Phone, 
  ShieldCheck, 
  Calendar,
  Package,
  MessageCircle,
  Sparkles
} from "lucide-react";

interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  membership_type: string;
}

interface SellerStats {
  total_listings: number;
  total_sales: number;
  avg_rating: number;
  total_reviews: number;
  points: number;
  level: number;
  total_auctions: number;
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
      const [listingsRes, reviewsRes, pointsRes, auctionsRes] = await Promise.all([
        supabase.from("listings").select("id, status").eq("user_id", sellerId),
        supabase.from("reviews").select("rating").eq("seller_id", sellerId),
        supabase.from("user_points").select("total_points, level").eq("user_id", sellerId).single(),
        supabase.from("auctions").select("id").eq("user_id", sellerId),
      ]);

      const totalListings = listingsRes.data?.length || 0;
      const totalSales = listingsRes.data?.filter(l => l.status === "sold").length || 0;
      const avgRating = reviewsRes.data?.length 
        ? reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length 
        : 0;
      const totalReviews = reviewsRes.data?.length || 0;
      const totalAuctions = auctionsRes.data?.length || 0;

      setStats({
        total_listings: totalListings,
        total_sales: totalSales,
        avg_rating: avgRating,
        total_reviews: totalReviews,
        points: pointsRes.data?.total_points || 0,
        level: pointsRes.data?.level || 1,
        total_auctions: totalAuctions,
      });
    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return "from-amber-400 to-yellow-600";
    if (level >= 5) return "from-purple-500 to-indigo-600";
    if (level >= 3) return "from-blue-500 to-cyan-600";
    return "from-emerald-500 to-teal-600";
  };

  const getLevelTitle = (level: number) => {
    if (level >= 10) return "بائع ماسي";
    if (level >= 5) return "بائع متميز";
    if (level >= 3) return "بائع نشط";
    return "بائع جديد";
  };

  if (loading) {
    return (
      <Card className="overflow-hidden sticky top-4 animate-pulse">
        <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="p-6 pt-14 space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full mx-auto -mt-20" />
          <div className="h-5 bg-muted rounded w-3/4 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card 
      className="overflow-hidden sticky top-4 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-2 border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/profile/${sellerId}`)}
    >
      {/* Header Banner */}
      <div className={`h-28 bg-gradient-to-r ${stats ? getLevelColor(stats.level) : 'from-primary to-accent'} relative overflow-hidden`}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-4 w-20 h-20 border-2 border-white/30 rounded-full" />
          <div className="absolute bottom-2 left-8 w-12 h-12 border-2 border-white/30 rounded-full" />
          <div className="absolute top-4 left-1/4 w-6 h-6 bg-white/20 rounded-full" />
        </div>
        
        {/* Level Badge on Banner */}
        {stats && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-bold text-white">{getLevelTitle(stats.level)}</span>
          </div>
        )}
        
        {/* Verified Badge */}
        {profile.membership_type === 'merchant' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-medium text-white">موثق</span>
          </div>
        )}
      </div>

      {/* Avatar - Overlapping Banner */}
      <div className="relative px-6 -mt-14">
        <div className="relative inline-block">
          <Avatar className="h-24 w-24 border-4 border-card shadow-xl group-hover:scale-105 transition-transform duration-300">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
            <AvatarFallback className={`text-3xl font-bold bg-gradient-to-br ${stats ? getLevelColor(stats.level) : 'from-primary to-accent'} text-white`}>
              {profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Level Indicator on Avatar */}
          {stats && (
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(stats.level)} flex items-center justify-center border-2 border-card shadow-lg`}>
              <span className="text-xs font-bold text-white">{stats.level}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4 space-y-5">
        {/* Name and Rating */}
        <div>
          <h4 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            {profile.full_name}
          </h4>
          
          {stats && stats.avg_rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(stats.avg_rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {stats.avg_rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.total_reviews.toLocaleString('en-US')} تقييم)
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid - Compact */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-3 text-center border border-border/30 hover:border-primary/30 transition-colors">
              <Package className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.total_listings.toLocaleString('en-US')}</p>
              <p className="text-[10px] text-muted-foreground font-medium">إعلان</p>
            </div>

            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-3 text-center border border-border/30 hover:border-primary/30 transition-colors">
              <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.total_sales.toLocaleString('en-US')}</p>
              <p className="text-[10px] text-muted-foreground font-medium">مبيعات</p>
            </div>

            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-3 text-center border border-border/30 hover:border-primary/30 transition-colors">
              <Award className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.total_auctions.toLocaleString('en-US')}</p>
              <p className="text-[10px] text-muted-foreground font-medium">مزاد</p>
            </div>
          </div>
        )}

        {/* Points Progress */}
        {stats && (
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getLevelColor(stats.level)}`}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-foreground">النقاط</span>
              </div>
              <span className="text-lg font-bold text-primary">{stats.points.toLocaleString('en-US')}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getLevelColor(stats.level)} transition-all duration-500`}
                style={{ width: `${Math.min((stats.points % 1000) / 10, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-left" dir="ltr">
              {(1000 - (stats.points % 1000)).toLocaleString('en-US')} نقطة للمستوى التالي
            </p>
          </div>
        )}

        {/* Contact Info */}
        {profile.phone && (
          <div 
            className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 border border-border/30 hover:border-green-500/30 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${profile.phone}`, '_self');
            }}
          >
            <div className="p-2 rounded-lg bg-green-500/10">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-mono text-foreground flex-1" dir="ltr">
              {profile.phone}
            </span>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className={`w-full bg-gradient-to-r ${stats ? getLevelColor(stats.level) : 'from-primary to-accent'} hover:opacity-90 text-white font-bold py-5 shadow-lg hover:shadow-xl transition-all`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${sellerId}`);
          }}
        >
          <User className="h-4 w-4 ml-2" />
          عرض الملف الشخصي
        </Button>

        {/* Member Since */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <p className="text-xs">
            عضو منذ {new Date(profile.created_at).toLocaleDateString("ar-SA", { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AuctionSellerSidebar;
