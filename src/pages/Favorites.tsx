import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ListingCard from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const Favorites = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndFetchFavorites();
  }, []);

  const checkUserAndFetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول لعرض المفضلة");
      navigate("/auth");
      return;
    }

    await fetchFavorites(user.id);
  };

  const fetchFavorites = async (userId: string) => {
    setIsLoading(true);
    
    try {
      // جلب الإعلانات المفضلة
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", userId);

      if (favoritesError) throw favoritesError;

      if (!favoritesData || favoritesData.length === 0) {
        setListings([]);
        setIsLoading(false);
        return;
      }

      // جلب تفاصيل الإعلانات
      const listingIds = favoritesData.map(f => f.listing_id);
      const { data: listingsData, error: listingsError } = await supabase
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
        .in("id", listingIds)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;

      setListings(listingsData || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("خطأ في جلب المفضلة");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <h1 className="text-xl font-semibold">المفضلة</h1>
            </div>
          </header>
          <main className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground mb-2">لا توجد إعلانات في المفضلة</p>
            <p className="text-sm text-muted-foreground">
              ابدأ بإضافة إعلانات إلى المفضلة بالنقر على أيقونة القلب
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => (
              <div key={listing.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  time={getTimeAgo(listing.created_at)}
                  image={
                    listing.images && listing.images.length > 0
                      ? listing.images[0]
                      : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                  }
                  category={listing.categories?.name || "عام"}
                />
              </div>
            ))}
          </div>
        )}
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Favorites;
