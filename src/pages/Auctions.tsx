import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuctionCard from "@/components/AuctionCard";
import CollectionTagsFilter from "@/components/CollectionTagsFilter";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Gavel, TrendingUp, Filter } from "lucide-react";

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
  season?: string;
  condition: string;
  condition_rating?: number;
  is_trending: boolean;
  tags?: string[];
  categories: {
    name: string;
  } | null;
  bid_count: number;
}

const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  
  // Filter states
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [showTrending, setShowTrending] = useState(false);

  const fetchAuctions = async (status: string) => {
    setLoading(true);
    
    let query = supabase
      .from("auctions")
      .select(`
        *,
        categories (
          name
        )
      `)
      .eq("status", status)
      .is("deleted_at", null);
    
    // For active auctions, only show those that haven't ended yet
    if (status === "active") {
      query = query.gt("end_time", new Date().toISOString());
    }
    
    query = query.order("end_time", { ascending: status === "active" });
    
    const { data, error } = await query;

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
      applyFilters(auctionsWithCounts);
    }
    
    setLoading(false);
  };

  const applyFilters = (auctionsList: Auction[]) => {
    let filtered = [...auctionsList];

    // Filter by trending
    if (showTrending) {
      filtered = filtered.filter(a => a.is_trending);
    }

    // Filter by condition
    if (selectedConditions.length > 0) {
      filtered = filtered.filter(a => selectedConditions.includes(a.condition));
    }

    // Filter by season
    if (selectedSeasons.length > 0) {
      filtered = filtered.filter(a => a.season && selectedSeasons.some(s => a.season?.includes(s.replace('_', ' '))));
    }

    setFilteredAuctions(filtered);
  };

  const handleConditionChange = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSeasonChange = (season: string) => {
    setSelectedSeasons(prev =>
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    );
  };

  const clearFilters = () => {
    setSelectedConditions([]);
    setSelectedSeasons([]);
    setShowTrending(false);
  };

  useEffect(() => {
    applyFilters(auctions);
  }, [selectedConditions, selectedSeasons, showTrending, auctions]);

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gavel className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold text-foreground">المزادات المباشرة</h1>
                <p className="text-lg text-muted-foreground">
                  شارك في المزادات الحية واحصل على أفضل المنتجات الفاخرة
                </p>
              </div>
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4 ml-2" />
                  الفلاتر
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>تصفية المزادات</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <CollectionTagsFilter
                    selectedConditions={selectedConditions}
                    selectedSeasons={selectedSeasons}
                    showTrending={showTrending}
                    onConditionChange={handleConditionChange}
                    onSeasonChange={handleSeasonChange}
                    onTrendingChange={setShowTrending}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full mt-6"
                    onClick={clearFilters}
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">تصفية المزادات</h3>
              <CollectionTagsFilter
                selectedConditions={selectedConditions}
                selectedSeasons={selectedSeasons}
                showTrending={showTrending}
                onConditionChange={handleConditionChange}
                onSeasonChange={handleSeasonChange}
                onTrendingChange={setShowTrending}
              />
              <Button 
                variant="outline" 
                className="w-full mt-6"
                onClick={clearFilters}
              >
                إعادة تعيين
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="active" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              المزادات النشطة ({filteredAuctions.filter(a => a.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="ended" className="gap-2">
              <Gavel className="h-4 w-4" />
              المزادات المنتهية ({filteredAuctions.filter(a => a.status === 'ended').length})
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
            ) : filteredAuctions.length === 0 ? (
              <div className="text-center py-16">
                <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  لا توجد مزادات تطابق الفلاتر المحددة
                </h3>
                <p className="text-muted-foreground mb-4">
                  جرب تغيير الفلاتر أو إعادة تعيينها
                </p>
                <Button onClick={clearFilters} variant="outline">
                  إعادة تعيين الفلاتر
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    id={auction.id}
                    listingId={auction.listing_id || ""}
                    title={auction.title}
                    description={auction.description || undefined}
                    currentBid={auction.current_bid}
                    startingPrice={auction.starting_price}
                    endTime={auction.end_time}
                    image={auction.images?.[0] || "/placeholder.svg"}
                    category={auction.categories?.name || "عام"}
                    status={auction.status}
                    totalBids={auction.bid_count}
                    season={auction.season}
                    condition={auction.condition}
                    conditionRating={auction.condition_rating}
                    isTrending={auction.is_trending}
                    tags={auction.tags}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auctions;
