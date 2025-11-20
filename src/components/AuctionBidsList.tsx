import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, ArrowUpCircle, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  user_id: string;
  is_autobid: boolean;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  previous_bid?: number;
}

interface AuctionBidsListProps {
  auctionId: string;
  startingPrice: number;
  highestBidderId?: string;
}

const AuctionBidsList = ({ auctionId, startingPrice, highestBidderId }: AuctionBidsListProps) => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from("bids")
      .select("id, bid_amount, created_at, user_id, is_autobid")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles and calculate previous bids
      const bidsWithProfiles = await Promise.all(
        data.map(async (bid, index) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", bid.user_id)
            .single();
          
          // Get previous bid amount (the bid before this one)
          const previousBid = index < data.length - 1 
            ? data[index + 1].bid_amount 
            : startingPrice;
          
          return {
            ...bid,
            profiles: profile || { full_name: "مستخدم", avatar_url: undefined },
            previous_bid: previousBid,
          };
        })
      );
      setBids(bidsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBids();

    // Subscribe to new bids
    const channel = supabase
      .channel(`bids-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `auction_id=eq.${auctionId}`,
        },
        () => {
          fetchBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">لا توجد عروض بعد</p>
        <p className="text-sm text-muted-foreground mt-1">كن أول من يقدم عرضاً!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">سجل المزايدات</h3>
        <Badge variant="secondary" className="mr-auto">
          {bids.length} مزايدة
        </Badge>
      </div>

      <div className="space-y-3">
        {bids.map((bid, index) => {
          const increase = bid.bid_amount - (bid.previous_bid || 0);
          const isHighest = bid.user_id === highestBidderId && index === 0;
          
          return (
            <Card
              key={bid.id}
              className={`p-4 transition-all hover:shadow-md ${
                isHighest
                  ? "bg-primary/5 border-2 border-primary"
                  : "bg-card border border-border"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar and User Info */}
                <div className="flex-shrink-0">
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/profile/${bid.user_id}`)}
                  >
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={bid.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {bid.profiles?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Bid Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => navigate(`/profile/${bid.user_id}`)}
                      className="font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {bid.profiles?.full_name || "مستخدم"}
                    </button>
                    {isHighest && (
                      <Badge className="bg-green-600 text-white">
                        أعلى مزايدة
                      </Badge>
                    )}
                    {bid.is_autobid && (
                      <Badge variant="outline" className="text-xs">
                        مزايدة تلقائية
                      </Badge>
                    )}
                  </div>

                  {/* Bid Amounts Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-1">السعر السابق</p>
                      <p className="text-sm font-semibold text-foreground">
                        {(bid.previous_bid || startingPrice).toLocaleString("ar-SA")} ريال
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ArrowUpCircle className="h-3 w-3" />
                        الزيادة
                      </p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        +{increase.toLocaleString("ar-SA")} ريال
                      </p>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-1">المبلغ الجديد</p>
                      <p className="text-sm font-bold text-primary">
                        {bid.bid_amount.toLocaleString("ar-SA")} ريال
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(bid.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>
                      {format(new Date(bid.created_at), "PPp", { locale: ar })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AuctionBidsList;
