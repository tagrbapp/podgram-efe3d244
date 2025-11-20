import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Gavel } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  starting_price: number;
  current_bid: number | null;
  end_time: string;
  status: string;
  bid_increment: number;
}

interface SimilarAuctionsProps {
  categoryId: string | null;
  currentAuctionId: string;
}

const SimilarAuctions = ({ categoryId, currentAuctionId }: SimilarAuctionsProps) => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarAuctions();
  }, [categoryId, currentAuctionId]);

  const fetchSimilarAuctions = async () => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .eq("category_id", categoryId)
        .eq("status", "active")
        .neq("id", currentAuctionId)
        .gt("end_time", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error("Error fetching similar auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (auctions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-border/50">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Gavel className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">مزادات مشابهة</h3>
            <p className="text-sm text-muted-foreground">
              مزادات أخرى قد تهمك في نفس الفئة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auctions.map((auction) => {
            const timeLeft = formatDistanceToNow(new Date(auction.end_time), {
              addSuffix: true,
              locale: ar,
            });

            return (
              <Card
                key={auction.id}
                className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/auction/${auction.id}`)}
              >
                {/* صورة المزاد */}
                <div className="relative h-40 overflow-hidden bg-muted">
                  {auction.images && auction.images.length > 0 ? (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingUp className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600 text-white animate-pulse">
                      نشط
                    </Badge>
                  </div>
                </div>

                {/* معلومات المزاد */}
                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {auction.title}
                  </h4>

                  {auction.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {auction.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        السعر الحالي
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {auction.current_bid
                          ? auction.current_bid.toLocaleString("ar-SA")
                          : auction.starting_price.toLocaleString("ar-SA")}{" "}
                        <span className="text-sm">ريال</span>
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        ينتهي
                      </p>
                      <p className="text-sm font-medium">{timeLeft}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default SimilarAuctions;
