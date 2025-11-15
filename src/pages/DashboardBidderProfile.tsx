import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Activity, Target, Zap, Star, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface BidderStats {
  total_bids: number;
  won_auctions: number;
  avg_rating: number;
  reliability_score: number;
  payment_speed_rating: number;
  communication_rating: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  review_type: string;
  created_at: string;
  reviewer: { full_name: string; avatar_url: string | null };
}

export default function DashboardBidderProfile() {
  const [stats, setStats] = useState<BidderStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: statsData, error: statsError } = await supabase
        .from('bidder_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // جلب المراجعات مع بيانات المراجعين
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('bidder_reviews')
        .select('id, rating, comment, review_type, created_at, reviewer_id')
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) console.error('Error fetching reviews:', reviewsError);

      // جلب بيانات المراجعين
      let enrichedReviews: Review[] = [];
      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = reviewsData.map(r => r.reviewer_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', reviewerIds);

        enrichedReviews = reviewsData.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment || '',
          review_type: review.review_type,
          created_at: review.created_at,
          reviewer: profilesData?.find(p => p.id === review.reviewer_id) || { full_name: 'مستخدم', avatar_url: null }
        }));
      }

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id);

      if (statsError) console.error('Error fetching stats:', statsError);
      if (reviewsError) console.error('Error fetching reviews:', reviewsError);

      setProfile(profileData);
      setStats(statsData || { total_bids: 0, won_auctions: 0, avg_rating: 0, reliability_score: 0, payment_speed_rating: 0, communication_rating: 0 });
      setReviews(enrichedReviews);
      setBadges(badgesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = { Shield, Activity, Target, Zap, Star, Trophy };
    return icons[iconName] || Star;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">جاري التحميل...</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">ملفي كمزايد</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.full_name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mb-2">{profile?.full_name}</h2>
            <Badge variant="secondary" className="mb-4">مزايد</Badge>

            <div className="w-full space-y-3 mt-4">
              <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm">المعدل العام</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{stats?.avg_rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm">درجة الموثوقية</span>
                <span className="font-bold text-primary">{stats?.reliability_score || 0}/100</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats and Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">{stats?.total_bids || 0}</div>
              <div className="text-sm text-muted-foreground">إجمالي العروض</div>
            </Card>
            <Card className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">{stats?.won_auctions || 0}</div>
              <div className="text-sm text-muted-foreground">مزادات مكتسبة</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{stats?.payment_speed_rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="text-sm text-muted-foreground">سرعة الدفع</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{stats?.communication_rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="text-sm text-muted-foreground">التواصل</div>
            </Card>
          </div>

          {/* Badges */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              الشارات ({badges.length})
            </h3>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لم تحصل على أي شارات بعد
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => {
                  const IconComponent = getIconComponent(badge.badges.icon);
                  return (
                    <Badge key={badge.id} variant="secondary" className="gap-2 p-3">
                      <IconComponent className="w-4 h-4" />
                      <span>{badge.badges.name}</span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">التقييمات ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد تقييمات بعد
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.reviewer.avatar_url || ''} />
                          <AvatarFallback>{review.reviewer.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{review.reviewer.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mb-2" dir="rtl">{review.comment}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {review.review_type === 'payment_speed' ? 'سرعة الدفع' :
                         review.review_type === 'communication' ? 'التواصل' : 'الموثوقية'}
                      </Badge>
                      <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}