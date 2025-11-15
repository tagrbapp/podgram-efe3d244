import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import CategoryCircle from "@/components/CategoryCircle";
import ActionCard from "@/components/ActionCard";
import HeroCarousel from "@/components/HeroCarousel";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { supabase } from "@/integrations/supabase/client";

import categoryWatches from "@/assets/category-watches.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryMens from "@/assets/category-mens.jpg";
import actionTradein from "@/assets/action-tradein.jpg";
import actionSell from "@/assets/action-sell.jpg";

interface Category {
  id: string;
  name: string;
  image: string;
  count?: number;
  badge?: string;
  badgeColor?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[] | null;
  category_name?: string;
}

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) {
      const categoriesWithImages: Category[] = [
        { id: data[0]?.id || "1", name: "ساعات فاخرة", image: categoryWatches, count: 120 },
        { id: data[1]?.id || "2", name: "حقائب يد", image: categoryBags, count: 85, badge: "حمية", badgeColor: "bg-yellow-500" },
        { id: data[2]?.id || "3", name: "مجوهرات", image: categoryJewelry, count: 95 },
        { id: data[3]?.id || "4", name: "أزياء رجالية", image: categoryMens, count: 150 },
        { id: data[0]?.id || "5", name: "عطور", image: categoryWatches, count: 60, badge: "خصم 60%", badgeColor: "bg-red-500" },
      ];
      setCategories(categoriesWithImages);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select(`*, categories (name)`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);

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
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <CategoryCircle key={category.id} image={category.image} title={category.name} badge={category.badge} badgeColor={category.badgeColor} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Side - Carousel Section */}
              <HeroCarousel />

              {/* Right Side - Text Section */}
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

            {/* Announcements Section */}
            <div className="mt-12">
              <AnnouncementBanner />
            </div>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ActionCard title="استبدال" image={actionTradein} bgColor="bg-sky-200" />
              <ActionCard title="بيع منتجك" image={actionSell} bgColor="bg-amber-200" />
              <ActionCard title="رهن" image={actionTradein} bgColor="bg-orange-200" />
              <ActionCard title="تقييم" image={actionSell} bgColor="bg-blue-300" />
              <ActionCard title="تنظيف الخزانة" image={actionTradein} bgColor="bg-stone-300" />
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;

