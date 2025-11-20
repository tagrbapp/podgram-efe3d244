import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuctionCard from "@/components/AuctionCard";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, TrendingUp } from "lucide-react";

interface Auction {
  id: string;
  listing_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  images: string[] | null;
  starting_price: number;
  current_bid: number | null;
  end_time: string;
  status: string;
  categories: {
    name: string;
  } | null;
  bid_count: number;
}

const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const fetchAuctions = async (status: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("auctions")
      .select(`
        *,
        categories (
          name
        )
      `)
      .eq("status", status)
      .order("end_time", { ascending: status === "active" });

    if (!error && data) {
      // Fetch bid counts for each auction
      const auctionsWithCounts = await Promise.all(
        data.map(async (auction) => {
          const { count } = await supabase
            .from("bids")
            .select("*", { count: "exact", head: true })
            .eq("auction_id", auction.id);
          
          return {
            ...auction,
            bid_count: count || 0,
          };
        })
      );
      
      setAuctions(auctionsWithCounts);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAuctions(activeTab);

    // Subscribe to auction updates
    const channel = supabase
      .channel("auctions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auctions",
        },
        () => {
          fetchAuctions(activeTab);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="المزادات المباشرة - Podgram | مزادات المنتجات الفاخرة"
        description="شارك في المزادات الحية واحصل على أفضل المنتجات الفاخرة بأسعار تنافسية. ساعات، حقائب، مجوهرات، سيارات وعقارات."
        keywords="مزادات مباشرة, مزادات فاخرة, مزادات سيارات, مزادات ساعات, مزادات عقارات, السعودية"
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gavel className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">المزادات المباشرة</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            شارك في المزادات الحية واحصل على أفضل المنتجات الفاخرة بأسعار تنافسية
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              المزادات النشطة
            </TabsTrigger>
            <TabsTrigger value="ended" className="gap-2">
              <Gavel className="h-4 w-4" />
              المزادات المنتهية
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-16">
                <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  لا توجد مزادات {activeTab === "active" ? "نشطة" : "منتهية"} حالياً
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === "active"
                    ? "تابعنا لمعرفة المزادات القادمة"
                    : "تصفح المزادات النشطة"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {auctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    id={auction.id}
                    listingId={auction.listing_id || ""}
                    title={auction.title}
                    currentBid={auction.current_bid}
                    startingPrice={auction.starting_price}
                    endTime={auction.end_time}
                    image={auction.images?.[0] || "/placeholder.svg"}
                    category={auction.categories?.name || "عام"}
                    status={auction.status}
                    totalBids={auction.bid_count}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Auctions;
