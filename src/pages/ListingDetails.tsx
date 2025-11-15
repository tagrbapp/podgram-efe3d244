import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, MessageCircle, MessageSquare, ArrowRight, Eye, Heart } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  description: string;
  phone: string;
  email: string;
  images: string[];
  created_at: string;
  views: number;
  user_id: string;
  category: {
    name: string;
  };
  profiles: {
    full_name: string;
    phone: string;
  } | null;
}

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchListing();
    incrementViews();
    checkFavoriteStatus();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select(`
          *,
          category:categories(name)
        `)
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (listingError) throw listingError;

      // Fetch profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", listingData.user_id)
        .maybeSingle();

      setListing({
        ...listingData,
        profiles: profileData
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("فشل تحميل تفاصيل الإعلان");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      // Increment views directly
      const { error } = await supabase
        .from("listings")
        .update({ views: (listing?.views || 0) + 1 })
        .eq("id", id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error incrementing views:", error);
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

  const handleWhatsApp = () => {
    const phone = listing?.phone || listing?.profiles?.phone;
    if (!phone) {
      toast.error("رقم الهاتف غير متوفر");
      return;
    }
    const message = encodeURIComponent(`مرحباً، أنا مهتم بإعلانك: ${listing?.title}`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    const phone = listing?.phone || listing?.profiles?.phone;
    if (!phone) {
      toast.error("رقم الهاتف غير متوفر");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const checkFavoriteStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول لإضافة المفضلة");
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("تم الإزالة من المفضلة");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, listing_id: id });

        if (error) throw error;
        setIsFavorite(true);
        toast.success("تم الإضافة للمفضلة");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("فشل في تحديث المفضلة");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const { session, user } = await getSession();
      
      if (!session || !user) {
        toast.error("يجب تسجيل الدخول للمراسلة");
        navigate("/auth");
        return;
      }

      if (user.id === listing?.user_id) {
        toast.error("لا يمكنك مراسلة نفسك");
        return;
      }

      // Check if conversation already exists
      const { data: existingConv, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", id)
        .eq("buyer_id", user.id)
        .eq("seller_id", listing?.user_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingConv) {
        // Navigate to existing conversation
        navigate("/messages");
        return;
      }

      // Create new conversation
      const { error: createError } = await supabase
        .from("conversations")
        .insert({
          listing_id: id,
          buyer_id: user.id,
          seller_id: listing?.user_id,
        });

      if (createError) throw createError;

      toast.success("تم بدء المحادثة");
      navigate("/messages");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("فشل في بدء المحادثة");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-qultura-blue hover:text-qultura-blue/80"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {listing.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-[4/3] bg-gray-50">
                            <img
                              src={image}
                              alt={`${listing.title} - صورة ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {listing.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4 bg-white/90 hover:bg-white border-gray-200" />
                        <CarouselNext className="right-4 bg-white/90 hover:bg-white border-gray-200" />
                      </>
                    )}
                  </Carousel>
                  
                  {/* Favorite Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`absolute top-4 left-4 rounded-full bg-white/90 hover:bg-white ${
                      isFavorite ? "text-red-500 hover:text-red-600" : ""
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>

                  {/* Image Counter */}
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      1 / {listing.images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد صور</p>
                </div>
              )}

              {/* Thumbnail Preview */}
              {listing.images && listing.images.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2 overflow-x-auto">
                    {listing.images.slice(0, 5).map((image, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-gray-200 hover:border-qultura-blue overflow-hidden cursor-pointer transition-all"
                      >
                        <img
                          src={image}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {listing.images.length > 5 && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">+{listing.images.length - 5}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-qultura-blue/10 text-qultura-blue border-0"
                    >
                      {listing.category.name}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-qultura-blue">
                  {listing.price.toLocaleString('ar-SA')} ريال
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-qultura-blue" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-qultura-blue" />
                  <span>{getTimeAgo(listing.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-qultura-blue" />
                  <span>{listing.views} مشاهدة</span>
                </div>
              </div>

              <div className="pt-6">
                <h2 className="text-lg font-semibold mb-3 text-foreground">الوصف</h2>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {listing.description || "لا يوجد وصف"}
                </p>
              </div>
            </div>
          </div>

          {/* Seller Info Sidebar */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">معلومات البائع</h2>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-qultura-blue/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-qultura-blue">
                      {listing.profiles?.full_name?.charAt(0) || "م"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {listing.profiles?.full_name || "مستخدم"}
                    </p>
                    <p className="text-sm text-muted-foreground">بائع</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-qultura-blue hover:bg-qultura-blue/90 text-white"
                  size="lg"
                >
                  <MessageSquare className="ml-2 h-5 w-5" />
                  ابدأ محادثة
                </Button>

                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-qultura-green hover:bg-qultura-green/90 text-white"
                  size="lg"
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  واتساب
                </Button>

                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="w-full border-gray-200 hover:bg-gray-50"
                  size="lg"
                >
                  <Phone className="ml-2 h-5 w-5" />
                  اتصال
                </Button>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800 text-center leading-relaxed">
                  ⚠️ تحذير: تأكد من المنتج قبل الشراء ولا تدفع مقدماً
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
