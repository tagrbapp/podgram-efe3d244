import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[] | null;
  categories: {
    name: string;
  } | null;
}

const iconMap: Record<string, any> = {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Briefcase,
};

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [searchQuery, selectedCategory, listings]);

  const fetchCategories = async () => {
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name, icon")
      .order("name");

    if (categoriesData) {
      // جلب عدد الإعلانات لكل تصنيف
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category) => {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("status", "active");

          return {
            ...category,
            count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCount);
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        created_at,
        images,
        categories (
          name
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);

    if (data) {
      setListings(data);
      setFilteredListings(data);
    }
    setIsLoading(false);
  };

  const filterListings = () => {
    let filtered = [...listings];

    // الفلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // الفلترة حسب التصنيف
    if (selectedCategory) {
      filtered = filtered.filter(
        (listing) => listing.categories?.name === selectedCategory
      );
    }

    setFilteredListings(filtered);
  };

  const handleSearch = () => {
    filterListings();
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryName);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              اعثر على ما تبحث عنه
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              آلاف الإعلانات المبوبة في انتظارك. اشتري، بع، أو أجر بكل سهولة
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl mx-auto shadow-elegant rounded-lg overflow-hidden bg-card p-2">
              <Input 
                placeholder="ابحث عن أي شيء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 border-0 bg-transparent text-right focus-visible:ring-0"
              />
              <Button 
                onClick={handleSearch}
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-smooth"
              >
                <Search className="h-4 w-4" />
                بحث
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">التصنيفات الرئيسية</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className={`cursor-pointer transition-all ${
                  selectedCategory === category.name ? "scale-105" : ""
                }`}
              >
                <CategoryCard
                  icon={iconMap[category.icon] || Car}
                  title={category.name}
                  count={category.count || 0}
                />
              </div>
            ))}
          </div>
          
          {/* عرض التصنيف المحدد */}
          {selectedCategory && (
            <div className="mt-6 text-center">
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                {selectedCategory} ✕
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              {selectedCategory
                ? `إعلانات ${selectedCategory}`
                : searchQuery
                ? "نتائج البحث"
                : "أحدث الإعلانات"}
            </h2>
            <div className="text-muted-foreground">
              {filteredListings.length} إعلان
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد إعلانات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  title={listing.title}
                  price={listing.price.toLocaleString("ar-SA")}
                  location={listing.location}
                  time={getTimeAgo(listing.created_at)}
                  image={
                    listing.images && listing.images.length > 0
                      ? listing.images[0]
                      : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                  }
                  category={listing.categories?.name || "عام"}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">إعلاناتي</h3>
              <p className="text-muted-foreground text-sm">
                منصتك الموثوقة للإعلانات المبوبة في المملكة
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">من نحن</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">الشروط والأحكام</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">التصنيفات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {categories.slice(0, 3).map((cat) => (
                  <li key={cat.id}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategoryClick(cat.name);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="hover:text-foreground transition-smooth"
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">تابعنا</h4>
              <p className="text-muted-foreground text-sm">
                ابق على تواصل معنا عبر منصات التواصل الاجتماعي
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 إعلاناتي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
