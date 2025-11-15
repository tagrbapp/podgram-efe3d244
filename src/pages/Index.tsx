import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Search, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-luxury.jpg";
import luxuryProducts from "@/assets/luxury-products.jpg";

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Luxury Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Luxury Marketplace" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-hero"></div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse-glow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass px-6 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">منصة الإعلانات الفاخرة</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-luxury text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
              اكتشف عالم من
              <br />
              <span className="text-gradient-primary">الفخامة والرقي</span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-arabic">
              منصتك الحصرية لبيع وشراء المنتجات الفاخرة والمميزة
              <br />
              تجربة تسوق استثنائية تليق بذوقك الراقي
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mt-12">
              <div className="glass-dark p-3 rounded-2xl shadow-glow">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="ابحث عن منتجك المفضل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pr-12 h-14 text-lg bg-background/50 border-border/50 focus:border-primary transition-smooth rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    size="lg"
                    className="h-14 px-8 bg-gradient-primary hover:shadow-glow transition-smooth text-primary-foreground font-bold rounded-xl group"
                  >
                    <span>بحث</span>
                    <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-12">
              {[
                { label: "إعلان نشط", value: String(listings.length) },
                { label: "تصنيف فاخر", value: String(categories.length) },
                { label: "عملاء راضون", value: "100+" }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="glass px-8 py-4 rounded-xl hover:scale-105 transition-smooth"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl font-bold text-gradient-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-luxury font-bold text-gradient-primary">
            تصنيفات مميزة
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-arabic">
            استكشف مجموعة واسعة من المنتجات الفاخرة في كافة التصنيفات
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon] || Briefcase;
            return (
              <div
                key={category.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleCategoryClick(category.name)}
              >
                <CategoryCard
                  icon={Icon}
                  title={category.name}
                  count={category.count || 0}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-luxury font-bold text-gradient-primary">
              إعلانات مميزة
            </h2>
            <p className="text-xl text-muted-foreground font-arabic">
              أحدث المنتجات الفاخرة المضافة
            </p>
          </div>
          {selectedCategory && (
            <Badge 
              variant="outline" 
              className="px-4 py-2 text-base border-primary/50 hover:bg-primary/10 transition-smooth cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              {selectedCategory} ✕
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-dark h-80 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredListings.map((listing, index) => (
              <div
                key={listing.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  time={getTimeAgo(listing.created_at)}
                  image={listing.images?.[0] || "/placeholder.svg"}
                  category={listing.categories?.name || "غير محدد"}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="glass-dark inline-block p-12 rounded-2xl">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground font-arabic">
                لا توجد إعلانات متاحة حالياً
              </p>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={luxuryProducts} 
            alt="Luxury Products" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-hero"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-luxury font-bold text-gradient-primary">
              ابدأ رحلتك الآن
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-arabic leading-relaxed">
              انضم إلى مجتمعنا الحصري واعرض منتجاتك الفاخرة
              <br />
              أو اكتشف كنوزاً جديدة كل يوم
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-8">
              <Button 
                size="lg"
                className="h-16 px-10 bg-gradient-primary hover:shadow-glow transition-smooth text-primary-foreground text-lg font-bold rounded-xl group"
              >
                <span>أضف إعلانك</span>
                <Sparkles className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-16 px-10 border-2 border-primary/50 hover:bg-primary/10 text-lg font-bold rounded-xl transition-smooth"
              >
                استكشف المزيد
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground font-arabic">
            <p className="text-lg">© 2024 MQ - مك. جميع الحقوق محفوظة.</p>
            <p className="mt-2">منصة الإعلانات المبوبة الفاخرة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
