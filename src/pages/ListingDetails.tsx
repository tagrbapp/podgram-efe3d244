import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, MessageCircle, ArrowRight, Eye } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchListing();
    incrementViews();
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* المحتوى الرئيسي */}
          <div className="md:col-span-2 space-y-6">
            {/* معرض الصور */}
            {listing.images && listing.images.length > 0 ? (
              <Card className="overflow-hidden">
                <Carousel className="w-full">
                  <CarouselContent>
                    {listing.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[16/9] bg-muted">
                          <img
                            src={image}
                            alt={`${listing.title} - صورة ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {listing.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              </Card>
            ) : (
              <Card className="aspect-[16/9] bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">لا توجد صور</p>
              </Card>
            )}

            {/* التفاصيل */}
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold text-foreground">{listing.title}</h1>
                <Badge variant="secondary" className="shrink-0">
                  {listing.category.name}
                </Badge>
              </div>

              <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
                {listing.price} ريال
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeAgo(listing.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views} مشاهدة</span>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="text-xl font-semibold mb-3">الوصف</h2>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {listing.description || "لا يوجد وصف"}
                </p>
              </div>
            </Card>
          </div>

          {/* معلومات البائع */}
          <div className="space-y-4">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">معلومات البائع</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                  <p className="text-foreground font-medium">
                    {listing.profiles?.full_name || "مستخدم"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                  size="lg"
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  واتساب
                </Button>

                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Phone className="ml-2 h-5 w-5" />
                  اتصال
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  تحذير: تأكد من المنتج قبل الشراء ولا تدفع مقدماً
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
