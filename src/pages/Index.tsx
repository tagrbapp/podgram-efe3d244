import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import HeroCarousel from "@/components/HeroCarousel";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import AuctionCard from "@/components/AuctionCard";
import { supabase } from "@/integrations/supabase/client";
import { Gavel, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[] | null;
  category_name?: string;
}

interface Auction {
  id: string;
  listing_id: string | null;
  title: string;
  images: string[] | null;
  category_id: string | null;
  starting_price: number;
  current_bid: number | null;
  end_time: string;
  status: string;
  categories: {
    name: string;
  } | null;
  bid_count: number;
}

const Index = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [sectionVisibility, setSectionVisibility] = useState({
    hero: true,
    announcements: true,
    live_auctions: true,
    featured_listings: true,
  });
  const [sectionSettings, setSectionSettings] = useState({
    hero: { items_limit: 12, background_color: "bg-gray-50" },
    announcements: { items_limit: 12, background_color: "bg-gray-50" },
    live_auctions: { items_limit: 6, background_color: "bg-background" },
    featured_listings: { items_limit: 12, background_color: "bg-gray-50" },
  });

  useEffect(() => {
    const initializeData = async () => {
      const settings = await fetchSectionSettings();
      if (settings) {
        fetchListings(settings);
        fetchAuctions(settings);
      }
    };
    initializeData();
  }, []);

  const fetchSectionSettings = async () => {
    const { data } = await supabase
      .from("homepage_sections")
      .select("section_key, is_visible, items_limit, background_color");
    
    if (data) {
      const visibility: Record<string, boolean> = {};
      const settings: Record<string, any> = {};
      
      data.forEach((section) => {
        visibility[section.section_key] = section.is_visible;
        settings[section.section_key] = {
          items_limit: section.items_limit,
          background_color: section.background_color,
        };
      });
      
      setSectionVisibility(visibility as any);
      setSectionSettings(settings as any);
      
      return settings;
    }
    return null;
  };

  const fetchListings = async (settings?: any) => {
    setLoading(true);
    const currentSettings = settings || sectionSettings;
    const listingLimit = currentSettings.featured_listings?.items_limit || 12;
    
    const { data } = await supabase
      .from("listings")
      .select(`*, categories (name)`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(listingLimit);

    if (data) {
      const formattedListings = data.map((listing) => ({
        ...listing,
        category_name: listing.categories?.name || "غير محدد",
      }));
      setListings(formattedListings);
      setFilteredListings(formattedListings);
    }
    setLoading(false);
  };

  const fetchAuctions = async (settings?: any) => {
    setAuctionsLoading(true);
    const currentSettings = settings || sectionSettings;
    const auctionLimit = currentSettings.live_auctions?.items_limit || 6;
    
    const { data } = await supabase
      .from("auctions")
      .select(`
        *,
        categories (
          name
        )
      `)
      .in("status", ["active", "ended"])
      .order("created_at", { ascending: false })
      .limit(auctionLimit);

    if (data) {
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
    setAuctionsLoading(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className={`py-12 ${sectionSettings.hero?.background_color || "bg-gray-50"}`}>
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            {sectionVisibility.hero && (
              <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                <HeroCarousel />
                <div className="text-center lg:text-right px-8">
                  <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                    It is profitable to buy<br/>
                    <span className="text-foreground">It is profitable to sell</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    المنصة الأولى لإعادة بيع المنتجات الفاخرة<br/>
                    مع خدمات ثابتة
                  </p>
                  <button className="px-8 py-3 bg-[hsl(var(--qultura-light-blue))] text-[hsl(var(--qultura-blue))] rounded-lg hover:opacity-90 transition-opacity font-medium">
                    اكتشف المزيد
                  </button>
                </div>
              </div>
            )}

            {/* Announcements Section */}
            {sectionVisibility.announcements && (
              <div className="mt-12">
                <AnnouncementBanner />
              </div>
            )}
          </div>
        </section>

        {/* Live Auctions Section */}
        {sectionVisibility.live_auctions && (
          <section className={`py-12 ${sectionSettings.live_auctions?.background_color || "bg-background"}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h2 className="text-4xl font-bold text-foreground">المزادات المباشرة</h2>
                  <Gavel className="w-10 h-10 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground">
                  شارك في المزادات الحية واحصل على أفضل المنتجات الفاخرة بأسعار تنافسية
                </p>
              </div>

              <Tabs defaultValue="active" className="w-full" dir="rtl">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                  <TabsTrigger value="active" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    المزادات النشطة
                  </TabsTrigger>
                  <TabsTrigger value="ended" className="gap-2">
                    <Gavel className="w-4 h-4" />
                    المزادات المنتهية
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 bg-card rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : auctions.filter(a => a.status === "active").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {auctions
                        .filter(a => a.status === "active")
                        .map((auction) => (
                          <AuctionCard
                            key={auction.id}
                            id={auction.id}
                            listingId={auction.listing_id || ""}
                            title={auction.title}
                            currentBid={auction.current_bid}
                            startingPrice={auction.starting_price}
                            endTime={auction.end_time}
                            image={auction.images?.[0] || "/placeholder.svg"}
                            category={auction.categories?.name || "غير محدد"}
                            status={auction.status}
                            totalBids={auction.bid_count}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Gavel className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        لا توجد مزادات نشطة حالياً
                      </h3>
                      <p className="text-muted-foreground">تابعنا لمعرفة المزادات القادمة</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ended">
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 bg-card rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : auctions.filter(a => a.status === "ended").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {auctions
                        .filter(a => a.status === "ended")
                        .map((auction) => (
                          <AuctionCard
                            key={auction.id}
                            id={auction.id}
                            listingId={auction.listing_id || ""}
                            title={auction.title}
                            currentBid={auction.current_bid}
                            startingPrice={auction.starting_price}
                            endTime={auction.end_time}
                            image={auction.images?.[0] || "/placeholder.svg"}
                            category={auction.categories?.name || "غير محدد"}
                            status={auction.status}
                            totalBids={auction.bid_count}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Gavel className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        لا توجد مزادات منتهية
                      </h3>
                      <p className="text-muted-foreground">لم تنته أي مزادات بعد</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}

        {/* Featured Listings Section */}
        {sectionVisibility.featured_listings && (
          <section className={`py-12 ${sectionSettings.featured_listings?.background_color || "bg-gray-50"}`}>
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-gray-900">الإعلانات المميزة</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (<div key={i} className="h-80 bg-white rounded-2xl animate-pulse" />))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} id={listing.id} title={listing.title} price={listing.price} location={listing.location} time={getTimeAgo(listing.created_at)} image={listing.images?.[0] || "/placeholder.svg"} category={listing.category_name || "غير محدد"} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><p className="text-gray-500">لا توجد إعلانات حالياً</p></div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
