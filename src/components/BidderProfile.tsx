import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Target, Zap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BidderStats {
  total_bids: number;
  won_auctions: number;
  avg_rating: number;
  reliability_score: number;
  payment_speed_rating: number;
  communication_rating: number;
}

interface BidderBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BidderProfileProps {
  userId: string;
  userName?: string;
  avatarUrl?: string;
}

export const BidderProfile = ({ userId, userName, avatarUrl }: BidderProfileProps) => {
  const [stats, setStats] = useState<BidderStats | null>(null);
  const [badges, setBadges] = useState<BidderBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBidderData();
  }, [userId]);

  const fetchBidderData = async () => {
    try {
      const { data: statsData } = await supabase
        .from('bidder_stats' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name, icon, color)')
        .eq('user_id', userId);

      setStats((statsData as any) || {
        total_bids: 0,
        won_auctions: 0,
        avg_rating: 0,
        reliability_score: 0,
        payment_speed_rating: 0,
        communication_rating: 0
      });

      if (badgesData) {
        setBadges(badgesData.map((b: any) => ({
          id: b.badge_id,
          name: b.badges.name,
          icon: b.badges.icon,
          color: b.badges.color
        })));
      }
    } catch (error) {
      console.error('Error fetching bidder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Shield,
      Activity,
      Target,
      Zap,
      Star
    };
    return icons[iconName] || Star;
  };

  if (loading) {
    return <Card className="p-6">جاري التحميل...</Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="w-16 h-16">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{userName?.[0] || 'M'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{userName || 'مزايد'}</h3>
          <p className="text-sm text-muted-foreground">ملف المزايد</p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats?.total_bids || 0}</div>
          <div className="text-xs text-muted-foreground">إجمالي العروض</div>
        </div>
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats?.won_auctions || 0}</div>
          <div className="text-xs text-muted-foreground">مزادات مكتسبة</div>
        </div>
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats?.reliability_score || 0}</div>
          <div className="text-xs text-muted-foreground">درجة الموثوقية</div>
        </div>
      </div>

      {/* التقييمات */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm">المعدل العام</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{stats?.avg_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">سرعة الدفع</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{stats?.payment_speed_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">التواصل</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{stats?.communication_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>

      {/* الشارات */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">الشارات</h4>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const IconComponent = getIconComponent(badge.icon);
              return (
                <Badge key={badge.id} variant="secondary" className="gap-1">
                  <IconComponent className="w-3 h-3" />
                  {badge.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};