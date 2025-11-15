import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface AuctionBidsListProps {
  auctionId: string;
  highestBidderId?: string;
}

const AuctionBidsList = ({ auctionId, highestBidderId }: AuctionBidsListProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from("bids")
      .select("id, bid_amount, created_at, user_id")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      // Fetch profiles separately
      const bidsWithProfiles = await Promise.all(
        data.map(async (bid) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", bid.user_id)
            .single();
          
          return {
            ...bid,
            profiles: profile || { full_name: "مستخدم", avatar_url: undefined },
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
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">سجل العروض</h3>
        <Badge variant="secondary" className="mr-auto">
          {bids.length} عرض
        </Badge>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {bids.map((bid, index) => (
          <div
            key={bid.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              bid.user_id === highestBidderId && index === 0
                ? "bg-primary/10 border-2 border-primary/30"
                : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={bid.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {bid.profiles?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {bid.profiles?.full_name || "مستخدم"}
                </p>
                {bid.user_id === highestBidderId && index === 0 && (
                  <Badge className="bg-green-600 text-white">أعلى عرض</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(bid.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </p>
              </div>
            </div>

            <div className="text-left">
              <p className="text-xl font-bold text-primary">
                {bid.bid_amount.toLocaleString("ar-SA")}
              </p>
              <p className="text-xs text-muted-foreground">ريال</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuctionBidsList;
