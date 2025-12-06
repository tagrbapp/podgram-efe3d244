import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import HeroCarousel from "@/components/HeroCarousel";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import AuctionCard from "@/components/AuctionCard";
import CategoryCard from "@/components/CategoryCard";
import AliExpressProductCard from "@/components/AliExpressProductCard";
import { CJProductCard } from "@/components/CJProductCard";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import CategoriesStrip from "@/components/CategoriesStrip";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { fetchShopifyProducts, ShopifyProduct } from "@/lib/shopify";
import { Gavel, TrendingUp, Package, Watch, Briefcase, Home, Car, ShoppingBag, Gem, Building2, Smartphone, Shirt, Dumbbell, Book, Refrigerator, ShoppingCart, Truck, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[] | null;
  category_name?: string;
  season?: string;
  condition?: string;
  condition_rating?: number;
  is_trending?: boolean;
  tags?: string[];
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

interface Category {
  id: string;
  name: string;
  icon: string;
  listings_count: number;
}

interface AliExpressProduct {
  id: string;
  title: string;
  title_ar: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  product_url: string;
  seller_rating: number | null;
  shipping_cost: number | null;
  shipping_time: string | null;
  currency: string | null;
}

interface CJProduct {
  id: string;
  cj_product_id: string;
  title: string;
  title_ar: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  product_url: string;
  shipping_cost: number | null;
  shipping_time: string | null;
  is_active: boolean;
}

const Index = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aliExpressProducts, setAliExpressProducts] = useState<AliExpressProduct[]>([]);
  const [cjProducts, setCJProducts] = useState<CJProduct[]>([]);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [aliExpressLoading, setAliExpressLoading] = useState(true);
  const [cjLoading, setCJLoading] = useState(true);
  const [shopifyLoading, setShopifyLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState({
    hero: true,
    announcements: true,
    categories: true,
    live_auctions: true,
    featured_listings: true,
    aliexpress_products: true,
    cjdropshipping_products: true,
    shopify_products: true,
  });
  const [sectionSettings, setSectionSettings] = useState({
    hero: { items_limit: 12, background_color: "bg-gray-50" },
    announcements: { items_limit: 12, background_color: "bg-gray-50" },
    categories: { items_limit: 8, background_color: "bg-muted/30" },
    live_auctions: { items_limit: 6, background_color: "bg-background" },
    featured_listings: { items_limit: 12, background_color: "bg-gray-50" },
    aliexpress_products: { items_limit: 8, background_color: "bg-background" },
    cjdropshipping_products: { items_limit: 8, background_color: "bg-background" },
    shopify_products: { items_limit: 8, background_color: "bg-background" },
  });

  useEffect(() => {
    const initializeData = async () => {
      const settings = await fetchSectionSettings();
      if (settings) {
        fetchListings(settings);
        fetchAuctions(settings);
        fetchCategories(settings);
        fetchAliExpressProducts(settings);
        fetchCJProducts(settings);
        fetchShopifyProductsData(settings);
      }
    };
    initializeData();

    // الاستماع للتحديثات في الوقت الفعلي على المزادات
    const channel = supabase
      .channel("auctions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auctions",
        },
        () => {
          fetchAuctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update filtered auctions when auctions change
  useEffect(() => {
    if (selectedCategoryId === null) {
      setFilteredAuctions(auctions);
    } else {
      setFilteredAuctions(auctions.filter(a => a.category_id === selectedCategoryId));
    }
  }, [auctions, selectedCategoryId]);

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
      .is("deleted_at", null)
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
      setFilteredAuctions(auctionsWithCounts);
    }
    setAuctionsLoading(false);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    if (categoryId === null) {
      setFilteredAuctions(auctions);
    } else {
      setFilteredAuctions(auctions.filter(a => a.category_id === categoryId));
    }
  };

  const fetchCategories = async (settings?: any) => {
    setCategoriesLoading(true);
    const currentSettings = settings || sectionSettings;
    const categoryLimit = currentSettings.categories?.items_limit || 8;
    
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) {
      const categoriesWithCounts = await Promise.all(
        data.slice(0, categoryLimit).map(async (category) => {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("status", "active");
          
          return {
            ...category,
            listings_count: count || 0,
          };
        })
      );
      
      setCategories(categoriesWithCounts);
    }
    setCategoriesLoading(false);
  };

  const fetchAliExpressProducts = async (settings?: any) => {
    setAliExpressLoading(true);
    const currentSettings = settings || sectionSettings;
    const productLimit = currentSettings.aliexpress_products?.items_limit || 8;
    
    const { data } = await supabase
      .from("aliexpress_products")
      .select("*")
      .eq("is_active", true)
      .order("imported_at", { ascending: false })
      .limit(productLimit);

    if (data) {
      setAliExpressProducts(data);
    }
    setAliExpressLoading(false);
  };

  const fetchCJProducts = async (settings?: any) => {
    setCJLoading(true);
    const currentSettings = settings || sectionSettings;
    const productLimit = currentSettings.cjdropshipping_products?.items_limit || 8;
    
    const { data } = await supabase
      .from("cjdropshipping_products")
      .select("*")
      .eq("is_active", true)
      .order("imported_at", { ascending: false })
      .limit(productLimit);

    if (data) {
      setCJProducts(data);
    }
    setCJLoading(false);
  };

  const fetchShopifyProductsData = async (settings?: any) => {
    setShopifyLoading(true);
    const currentSettings = settings || sectionSettings;
    const productLimit = currentSettings.shopify_products?.items_limit || 8;
    
    const products = await fetchShopifyProducts(productLimit);
    setShopifyProducts(products);
    setShopifyLoading(false);
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Watch, Briefcase, Home, Car, ShoppingBag, Gem, Package,
      Building2, Smartphone, Shirt, Dumbbell, Book, Refrigerator
    };
    return icons[iconName] || Package;
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
      <SEO 
        title="Podgram - منصة السوق الفاخرة الأولى | مزادات وإعلانات المنتجات الفاخرة"
        description="اكتشف أفضل منصة لبيع وشراء المنتجات الفاخرة في السعودية. ساعات، حقائب، مجوهرات، سيارات وعقارات. مزادات مباشرة وإعلانات موثوقة."
        keywords="مزادات فاخرة, ساعات فاخرة, حقائب فاخرة, مجوهرات, سيارات فاخرة, عقارات, بيع منتجات فاخرة, السعودية"
      />
      <Navbar />
      <main className="overflow-hidden">
        {/* Hero Section */}
        {sectionVisibility.hero && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-muted via-background to-accent/10">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Carousel */}
                <div className="order-2 lg:order-1 animate-fade-in">
                  <HeroCarousel />
                </div>

                {/* Hero Content */}
                <div className="order-1 lg:order-2 text-center lg:text-right space-y-8 animate-fade-in">
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
                      من المربح أن تشتري
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                        من المربح أن تبيع
                      </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                      المنصة الأولى لإعادة بيع المنتجات الفاخرة
                      <br />
                      <span className="text-primary font-semibold">مع خدمات موثوقة ومضمونة</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <button className="group px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-elegant transition-all hover:-translate-y-0.5 hover:scale-105">
                      <span>اكتشف المزيد</span>
                    </button>
                    <button className="px-8 py-4 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-accent/80 transition-all">
                      <span>تصفح المزادات</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Announcements */}
              {sectionVisibility.announcements && (
                <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <AnnouncementBanner />
                </div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}

        {/* Categories Section */}
        {sectionVisibility.categories && (
          <section className="relative py-16 lg:py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="text-center mb-12 space-y-4 animate-fade-in">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  تصفح حسب الفئة
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  اكتشف المنتجات الفاخرة في فئتك المفضلة
                </p>
              </div>

              {/* Categories Grid */}
              {categoriesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 bg-card rounded-3xl animate-pulse shadow-card" />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categories.map((category, index) => (
                    <div 
                      key={category.id} 
                      className="animate-scale-in hover-lift"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CategoryCard
                        icon={getCategoryIcon(category.icon)}
                        title={category.name}
                        count={category.listings_count}
                        id={category.id}
                        trending={category.listings_count > 10}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 animate-fade-in">
                  <p className="text-muted-foreground text-lg">لا توجد فئات متاحة حالياً</p>
                </div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}


        {/* Live Auctions Section */}
        {sectionVisibility.live_auctions && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-muted/30 to-background">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="text-center mb-8 space-y-4 animate-fade-in">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full mb-4">
                  <Gavel className="w-6 h-6 text-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    مزادات مباشرة
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  المزادات المباشرة
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  شارك في المزادات الحية واحصل على أفضل المنتجات الفاخرة بأسعار تنافسية
                </p>
              </div>

              {/* Categories Strip */}
              <div className="mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CategoriesStrip 
                  onCategorySelect={handleCategorySelect}
                  selectedCategory={selectedCategoryId}
                />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="active" className="w-full" dir="rtl">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 h-14 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger value="active" className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                    المزادات النشطة
                  </TabsTrigger>
                  <TabsTrigger value="ended" className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Gavel className="w-5 h-5" />
                    المزادات المنتهية
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="animate-fade-in">
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 bg-card rounded-3xl animate-pulse shadow-card" />
                      ))}
                    </div>
                  ) : filteredAuctions.filter(a => a.status === "active").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredAuctions
                        .filter(a => a.status === "active")
                        .map((auction) => (
                           <div key={auction.id} className="animate-scale-in hover-lift">
                            <AuctionCard
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
                              season={auction.season}
                              condition={auction.condition}
                              conditionRating={auction.condition_rating}
                              isTrending={auction.is_trending}
                              tags={auction.tags}
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 animate-fade-in">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
                        <Gavel className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        لا توجد مزادات نشطة حالياً
                      </h3>
                      <p className="text-muted-foreground text-lg">تابعنا لمعرفة المزادات القادمة</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ended" className="animate-fade-in">
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-96 bg-card rounded-3xl animate-pulse shadow-card" />
                      ))}
                    </div>
                  ) : filteredAuctions.filter(a => a.status === "ended").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredAuctions
                        .filter(a => a.status === "ended")
                        .map((auction) => (
                          <div key={auction.id} className="animate-scale-in hover-lift">
                            <AuctionCard
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
                              season={auction.season}
                              condition={auction.condition}
                              conditionRating={auction.condition_rating}
                              isTrending={auction.is_trending}
                              tags={auction.tags}
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 animate-fade-in">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
                        <Gavel className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        لا توجد مزادات منتهية
                      </h3>
                      <p className="text-muted-foreground text-lg">لم تنته أي مزادات بعد</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />
          </section>
        )}

        {/* Featured Listings Section */}
        {sectionVisibility.featured_listings && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-12 animate-fade-in">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
                      مميز
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                    الإعلانات المميزة
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    اكتشف أحدث المنتجات الفاخرة المعروضة للبيع
                  </p>
                </div>
                <button className="hidden md:inline-flex px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:shadow-elegant transition-all hover:-translate-y-0.5">
                  عرض الكل
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-80 bg-card rounded-3xl animate-pulse shadow-card" />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredListings.map((listing, index) => (
                    <div 
                      key={listing.id} 
                      className="animate-scale-in hover-lift"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ListingCard
                        id={listing.id}
                        title={listing.title}
                        price={listing.price}
                        location={listing.location}
                        time={getTimeAgo(listing.created_at)}
                        image={listing.images?.[0] || "/placeholder.svg"}
                        category={listing.category_name || "غير محدد"}
                        season={listing.season}
                        condition={listing.condition}
                        conditionRating={listing.condition_rating}
                        isTrending={listing.is_trending}
                        tags={listing.tags}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
                    <TrendingUp className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">لا توجد إعلانات حالياً</h3>
                  <p className="text-muted-foreground text-lg">تحقق لاحقاً من الإعلانات الجديدة</p>
                </div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}

        {/* AliExpress Products Section */}
        {sectionVisibility.aliexpress_products && aliExpressProducts.length > 0 && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-accent/5 to-background">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-12 animate-fade-in">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full mb-2">
                    <ShoppingCart className="w-5 h-5 text-[#FF6A00]" />
                    <span className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">
                      منتجات مستوردة
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                    منتجات AliExpress
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    اكتشف أفضل المنتجات المستوردة بأسعار تنافسية
                  </p>
                </div>
                <a 
                  href="/aliexpress-catalog" 
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-[#FF6A00] text-white rounded-full font-semibold hover:bg-[#FF6A00]/90 transition-colors"
                >
                  عرض الكل
                  <ShoppingCart className="w-4 h-4" />
                </a>
              </div>

              {aliExpressLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-card rounded-3xl animate-pulse shadow-card" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {aliExpressProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-scale-in hover-lift"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <AliExpressProductCard
                        id={product.id}
                        title={product.title}
                        titleAr={product.title_ar || undefined}
                        price={product.price}
                        originalPrice={product.original_price || undefined}
                        discountPercentage={product.discount_percentage || undefined}
                        images={product.images || []}
                        productUrl={product.product_url}
                        sellerRating={product.seller_rating || undefined}
                        shippingCost={product.shipping_cost || undefined}
                        shippingTime={product.shipping_time || undefined}
                        currency={product.currency || "SAR"}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile View All Button */}
              <div className="flex md:hidden justify-center mt-8">
                <a 
                  href="/aliexpress-catalog" 
                  className="flex items-center gap-2 px-6 py-3 bg-[#FF6A00] text-white rounded-full font-semibold hover:bg-[#FF6A00]/90 transition-colors"
                >
                  عرض كل المنتجات
                  <ShoppingCart className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF6A00]/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}

        {/* CJdropshipping Products Section */}
        {sectionVisibility.cjdropshipping_products && cjProducts.length > 0 && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-orange-500/5 to-background">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-12 animate-fade-in">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full mb-2">
                    <Truck className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
                      دروبشيبينغ
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                    منتجات CJdropshipping
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    منتجات متنوعة بجودة عالية وشحن سريع
                  </p>
                </div>
                <a 
                  href="/cj-catalog" 
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-500/90 transition-colors"
                >
                  عرض الكل
                  <Truck className="w-4 h-4" />
                </a>
              </div>

              {cjLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-card rounded-3xl animate-pulse shadow-card" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {cjProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-scale-in hover-lift"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CJProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile View All Button */}
              <div className="flex md:hidden justify-center mt-8">
                <a 
                  href="/cj-catalog" 
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-500/90 transition-colors"
                >
                  عرض كل المنتجات
                  <Truck className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}

        {/* Shopify Products Section */}
        {sectionVisibility.shopify_products && (
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-background via-green-500/5 to-background">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-12 animate-fade-in">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full mb-2">
                    <Store className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                      متجرنا
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                    منتجات المتجر
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    تسوق من منتجاتنا المميزة بأفضل الأسعار
                  </p>
                </div>
                <a 
                  href="/catalog?tab=shopify" 
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-600/90 transition-colors"
                >
                  عرض الكل
                  <Store className="w-4 h-4" />
                </a>
              </div>

              {shopifyLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-card rounded-3xl animate-pulse shadow-card" />
                  ))}
                </div>
              ) : shopifyProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {shopifyProducts.map((product, index) => (
                    <div 
                      key={product.node.id} 
                      className="animate-scale-in hover-lift"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ShopifyProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">لا توجد منتجات متاحة حالياً</p>
                </div>
              )}

              {/* Mobile View All Button */}
              <div className="flex md:hidden justify-center mt-8">
                <a 
                  href="/catalog?tab=shopify" 
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-600/90 transition-colors"
                >
                  عرض كل المنتجات
                  <Store className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
