import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Gavel, Clock, CheckCircle, Timer } from "lucide-react";
import { format } from "date-fns";

interface Auction {
  id: string;
  title: string | null;
  starting_price: number;
  current_bid: number | null;
  status: string;
  end_time: string;
  images: string[] | null;
  listing_id: string | null;
  listing?: {
    title: string;
    images: string[] | null;
  } | null;
}

interface UserAuctionsSectionProps {
  userId: string;
  limit?: number;
}

export const UserAuctionsSection = ({ userId, limit = 6 }: UserAuctionsSectionProps) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, ended: 0 });

  useEffect(() => {
    fetchAuctions();
  }, [userId]);

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from("auctions")
        .select(`
          id,
          title,
          starting_price,
          current_bid,
          status,
          end_time,
          images,
          listing_id,
          listing:listings(title, images)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const processedAuctions = (data || []).map(auction => ({
        ...auction,
        listing: Array.isArray(auction.listing) ? auction.listing[0] : auction.listing
      }));

      setAuctions(processedAuctions);
      
      const active = processedAuctions.filter(a => a.status === "active").length;
      const ended = processedAuctions.filter(a => a.status === "ended").length;
      setStats({ total: processedAuctions.length, active, ended });
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "انتهى";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} يوم`;
    }
    
    return `${hours}س ${minutes}د`;
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-card to-card/80">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gavel className="h-5 w-5 text-primary" />
          المزادات
        </CardTitle>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.total}</span> إجمالي
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <span className="font-semibold">{stats.active}</span> نشط
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-semibold">{stats.ended}</span> منتهي
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {auctions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Gavel className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">لا توجد مزادات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctions.map((auction) => {
              const title = auction.title || auction.listing?.title || "مزاد";
              const image = auction.images?.[0] || auction.listing?.images?.[0] || "/placeholder.svg";
              const isActive = auction.status === "active";
              
              return (
                <Link
                  key={auction.id}
                  to={`/auctions/${auction.id}`}
                  className="group"
                >
                  <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-md">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge
                        className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 ${
                          isActive 
                            ? "bg-green-500/90 hover:bg-green-500" 
                            : "bg-muted hover:bg-muted"
                        }`}
                      >
                        {isActive ? "نشط" : "منتهي"}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">السعر الحالي:</span>
                        <span className="text-sm font-bold text-primary">
                          {(auction.current_bid || auction.starting_price).toLocaleString("en-US")} ر.س
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        {isActive ? (
                          <>
                            <Timer className="h-3 w-3" />
                            <span>متبقي: {getTimeRemaining(auction.end_time)}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>انتهى في {format(new Date(auction.end_time), "yyyy/MM/dd")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
