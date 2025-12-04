import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AliExpressProductCard from "@/components/AliExpressProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Filter, Package, X, SlidersHorizontal } from "lucide-react";
import SEO from "@/components/SEO";

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
  category_id: string | null;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 12;

const AliExpressCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AliExpressProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateSearchParams();
  }, [selectedCategory, sortBy, currentPage, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    
    let query = supabase
      .from("aliexpress_products")
      .select(`*, categories (name)`, { count: "exact" })
      .eq("is_active", true);

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%`);
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "discount":
        query = query.order("discount_percentage", { ascending: false, nullsFirst: false });
        break;
      case "rating":
        query = query.order("seller_rating", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order("imported_at", { ascending: false });
    }

    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    if (data) {
      setProducts(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasActiveFilters = searchQuery || selectedCategory !== "all" || sortBy !== "newest";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEO
        title="كتالوج منتجات AliExpress | Podgram"
        description="تصفح جميع منتجات AliExpress المستوردة بأفضل الأسعار مع خيارات الشحن المتنوعة"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6A00]/10 flex items-center justify-center">
              <Package className="w-7 h-7 text-[#FF6A00]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">منتجات AliExpress</h1>
              <p className="text-muted-foreground">
                {totalCount.toLocaleString("en-US")} منتج متاح
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">تصفية النتائج</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-11"
                />
              </div>
            </form>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
                <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
                <SelectItem value="discount">الأكثر خصماً</SelectItem>
                <SelectItem value="rating">الأعلى تقييماً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  بحث: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  الفئة: {categories.find(c => c.id === selectedCategory)?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                </Badge>
              )}
              {sortBy !== "newest" && (
                <Badge variant="secondary" className="gap-1">
                  الترتيب: {sortBy === "price_asc" ? "الأقل سعراً" : sortBy === "price_desc" ? "الأعلى سعراً" : sortBy === "discount" ? "الأكثر خصماً" : "الأعلى تقييماً"}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSortBy("newest")} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive">
                مسح الكل
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground mb-4">جرب تغيير معايير البحث أو الفلاتر</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum.toLocaleString("en-US")}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AliExpressCatalog;
