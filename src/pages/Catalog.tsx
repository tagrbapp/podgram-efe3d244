import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import AuctionCard from "@/components/AuctionCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, GitCompare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ProductComparisonDialog from "@/components/ProductComparisonDialog";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[];
  views: number;
  description: string;
  category: {
    id: string;
    name: string;
  } | null;
  type: 'listing';
}

interface Auction {
  id: string;
  listing_id: string | null;
  title: string | null;
  starting_price: number;
  current_bid: number | null;
  end_time: string;
  status: string;
  images: string[] | null;
  category: {
    id: string;
    name: string;
  } | null;
  total_bids: number;
  type: 'auction';
}

type CatalogItem = Listing | Auction;

interface Category {
  id: string;
  name: string;
}

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [activeTab, setActiveTab] = useState<"active" | "ended">("active");
  const [compareProducts, setCompareProducts] = useState<Listing[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [searchParams, selectedCategories, priceRange, sortBy, activeTab]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    
    if (data) setCategories(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    const searchQuery = searchParams.get("q");
    
    // Fetch listings
    let listingsQuery = supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        created_at,
        images,
        views,
        description,
        category:categories(id, name)
      `)
      .eq("status", activeTab === "active" ? "active" : "sold")
      .gte("price", priceRange[0])
      .lte("price", priceRange[1]);

    if (selectedCategories.length > 0) {
      listingsQuery = listingsQuery.in("category_id", selectedCategories);
    }

    if (searchQuery) {
      listingsQuery = listingsQuery.ilike("title", `%${searchQuery}%`);
    }

    if (sortBy === "newest") {
      listingsQuery = listingsQuery.order("created_at", { ascending: false });
    } else if (sortBy === "price-asc") {
      listingsQuery = listingsQuery.order("price", { ascending: true });
    } else if (sortBy === "price-desc") {
      listingsQuery = listingsQuery.order("price", { ascending: false });
    }

    // Fetch auctions
    let auctionsQuery = supabase
      .from("auctions")
      .select(`
        id,
        listing_id,
        title,
        starting_price,
        current_bid,
        end_time,
        status,
        images,
        category:categories(id, name)
      `)
      .eq("status", activeTab === "active" ? "active" : "ended")
      .gte("starting_price", priceRange[0])
      .lte("starting_price", priceRange[1]);

    if (selectedCategories.length > 0) {
      auctionsQuery = auctionsQuery.in("category_id", selectedCategories);
    }

    if (searchQuery) {
      auctionsQuery = auctionsQuery.ilike("title", `%${searchQuery}%`);
    }

    if (sortBy === "newest") {
      auctionsQuery = auctionsQuery.order("created_at", { ascending: false });
    }

    const [listingsResult, auctionsResult] = await Promise.all([
      listingsQuery.limit(30),
      auctionsQuery.limit(30),
    ]);

    // Get bid counts for auctions
    const auctionIds = auctionsResult.data?.map((a) => a.id) || [];
    const { data: bidsData } = await supabase
      .from("bids")
      .select("auction_id")
      .in("auction_id", auctionIds);

    const bidCounts: Record<string, number> = {};
    bidsData?.forEach((bid) => {
      bidCounts[bid.auction_id] = (bidCounts[bid.auction_id] || 0) + 1;
    });

    // Combine and format data
    const formattedListings: Listing[] = (listingsResult.data || []).map((item) => ({
      ...item,
      type: 'listing' as const,
    }));

    const formattedAuctions: Auction[] = (auctionsResult.data || []).map((item) => ({
      ...item,
      total_bids: bidCounts[item.id] || 0,
      type: 'auction' as const,
    }));

    // Merge and sort
    const allItems: CatalogItem[] = [...formattedListings, ...formattedAuctions];
    
    if (sortBy === "price-asc") {
      allItems.sort((a, b) => {
        const priceA = a.type === 'listing' ? a.price : a.starting_price;
        const priceB = b.type === 'listing' ? b.price : b.starting_price;
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc") {
      allItems.sort((a, b) => {
        const priceA = a.type === 'listing' ? a.price : a.starting_price;
        const priceB = b.type === 'listing' ? b.price : b.starting_price;
        return priceB - priceA;
      });
    }

    setItems(allItems);
    setLoading(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 100000]);
    setSortBy("newest");
  };

  const toggleCompare = (item: CatalogItem) => {
    if (item.type !== 'listing') {
      toast.error("يمكنك مقارنة الإعلانات فقط");
      return;
    }
    
    setCompareProducts((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      } else {
        if (prev.length >= 3) {
          toast.error("يمكنك مقارنة 3 منتجات فقط");
          return prev;
        }
        return [...prev, item];
      }
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const isInCompare = (id: string) => {
    return compareProducts.some((p) => p.id === id);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "الآن";
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
  };

  const FiltersSidebar = () => (
    <div className="space-y-6">
      {/* Category Filters */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-foreground">التصنيفات</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
                className="border-gray-300"
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-foreground">نطاق السعر</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={100000}
            step={1000}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{priceRange[0].toLocaleString()} ريال</span>
            <span>{priceRange[1].toLocaleString()} ريال</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full"
      >
        <X className="ml-2 h-4 w-4" />
        مسح الفلاتر
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">الكتالوج</h1>
            <p className="text-muted-foreground">
              {loading ? "جاري التحميل..." : `${items.length} عنصر متاح`}
            </p>
          </div>

          {/* Sort & Mobile Filters */}
          <div className="flex items-center gap-3">
            {/* Compare Button */}
            {compareProducts.length > 0 && (
              <Button
                onClick={() => setCompareDialogOpen(true)}
                className="bg-qultura-blue hover:bg-qultura-blue/90"
              >
                <GitCompare className="ml-2 h-4 w-4" />
                مقارنة ({compareProducts.length})
              </Button>
            )}
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-qultura-blue"
            >
              <option value="newest">الأحدث</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
            </select>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>الفلاتر</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <FiltersSidebar />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "ended")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="active">النشطة</TabsTrigger>
                <TabsTrigger value="ended">المنتهية</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-0">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                      <Skeleton key={i} className="h-80 rounded-2xl" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">لا توجد عناصر نشطة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="relative">
                        {item.type === 'listing' ? (
                          <>
                            <ListingCard
                              id={item.id}
                              title={item.title}
                              price={item.price}
                              location={item.location}
                              time={getTimeAgo(item.created_at)}
                              image={item.images?.[0] || "/placeholder.svg"}
                              category={item.category?.name || "غير محدد"}
                            />
                            <div className="absolute top-4 left-4 z-10">
                              <Button
                                variant={isInCompare(item.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleCompare(item)}
                                className={isInCompare(item.id) ? "bg-qultura-blue hover:bg-qultura-blue/90" : "bg-white/90 hover:bg-white"}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <AuctionCard
                            id={item.id}
                            listingId={item.listing_id}
                            title={item.title || "مزاد"}
                            currentBid={item.current_bid || 0}
                            startingPrice={item.starting_price}
                            endTime={item.end_time}
                            image={item.images?.[0] || "/placeholder.svg"}
                            category={item.category?.name || "غير محدد"}
                            status={item.status}
                            totalBids={item.total_bids}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ended" className="mt-0">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                      <Skeleton key={i} className="h-80 rounded-2xl" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">لا توجد عناصر منتهية</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <div key={`${item.type}-${item.id}`}>
                        {item.type === 'listing' ? (
                          <ListingCard
                            id={item.id}
                            title={item.title}
                            price={item.price}
                            location={item.location}
                            time={getTimeAgo(item.created_at)}
                            image={item.images?.[0] || "/placeholder.svg"}
                            category={item.category?.name || "غير محدد"}
                          />
                        ) : (
                          <AuctionCard
                            id={item.id}
                            listingId={item.listing_id}
                            title={item.title || "مزاد"}
                            currentBid={item.current_bid || 0}
                            startingPrice={item.starting_price}
                            endTime={item.end_time}
                            image={item.images?.[0] || "/placeholder.svg"}
                            category={item.category?.name || "غير محدد"}
                            status={item.status}
                            totalBids={item.total_bids}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Comparison Dialog */}
      <ProductComparisonDialog
        products={compareProducts}
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        onRemove={removeFromCompare}
      />
    </div>
  );
};

export default Catalog;
