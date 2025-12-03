import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, Clock, TrendingUp, Trophy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  is_autobid: boolean;
  auction_id: string;
  auction: {
    id: string;
    title: string | null;
    current_bid: number | null;
    status: string;
    highest_bidder_id: string | null;
    images: string[] | null;
  } | null;
}

interface UserBidsHistoryProps {
  userId: string;
  limit?: number;
}

export const UserBidsHistory = ({ userId, limit = 5 }: UserBidsHistoryProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBids: 0, wonAuctions: 0, activeBids: 0 });

  useEffect(() => {
    fetchBids();
  }, [userId]);

  const fetchBids = async () => {
    try {
      // Fetch user's bids with auction details
      const { data: bidsData, error } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          created_at,
          is_autobid,
          auction_id,
          auctions (
            id,
            title,
            current_bid,
            status,
            highest_bidder_id,
            images
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedBids = bidsData?.map(bid => ({
        ...bid,
        auction: bid.auctions as Bid['auction']
      })) || [];

      setBids(formattedBids);

      // Calculate stats
      const totalBids = formattedBids.length;
      const wonAuctions = formattedBids.filter(
        b => b.auction?.status === 'ended' && b.auction?.highest_bidder_id === userId
      ).length;
      const activeBids = formattedBids.filter(
        b => b.auction?.status === 'active'
      ).length;

      setStats({ totalBids, wonAuctions, activeBids });
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBidStatus = (bid: Bid) => {
    if (!bid.auction) return { label: 'غير معروف', color: 'bg-muted' };
    
    if (bid.auction.status === 'ended') {
      if (bid.auction.highest_bidder_id === userId) {
        return { label: 'فائز', color: 'bg-green-500' };
      }
      return { label: 'منتهي', color: 'bg-muted' };
    }
    
    if (bid.auction.highest_bidder_id === userId) {
      return { label: 'الأعلى', color: 'bg-primary' };
    }
    
    return { label: 'تم تجاوزه', color: 'bg-orange-500' };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg border-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          آخر المزايدات
        </h2>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-primary/10">
          <div className="text-2xl font-bold text-primary">{stats.totalBids}</div>
          <div className="text-xs text-muted-foreground">إجمالي العروض</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <div className="text-2xl font-bold text-green-600">{stats.wonAuctions}</div>
          <div className="text-xs text-muted-foreground">مزادات مكتسبة</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <div className="text-2xl font-bold text-blue-600">{stats.activeBids}</div>
          <div className="text-xs text-muted-foreground">عروض نشطة</div>
        </div>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Gavel className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">لا توجد مزايدات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => {
            const status = getBidStatus(bid);
            return (
              <Link
                key={bid.id}
                to={`/auctions/${bid.auction_id}`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  {/* Auction Image */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {bid.auction?.images?.[0] ? (
                      <img
                        src={bid.auction.images[0]}
                        alt={bid.auction.title || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Bid Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {bid.auction?.title || 'مزاد'}
                      </p>
                      {bid.is_autobid && (
                        <Badge variant="outline" className="text-xs">
                          تلقائي
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {bid.bid_amount.toLocaleString('en-US')} ر.س
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(bid.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={`${status.color} text-white`}>
                      {status.label === 'فائز' && <Trophy className="h-3 w-3 ml-1" />}
                      {status.label}
                    </Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
};
