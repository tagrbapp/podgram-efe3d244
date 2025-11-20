import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Phone, MessageCircle, MessageSquare, ArrowRight, Eye, Heart, Maximize2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import ImageLightbox from "@/components/ImageLightbox";
import ListingCard from "@/components/ListingCard";
import AuctionTimer from "@/components/AuctionTimer";
import BidForm from "@/components/BidForm";
import AuctionBidsList from "@/components/AuctionBidsList";
import AutoBidSettings from "@/components/AutoBidSettings";
import { AuctionAlertForm } from "@/components/AuctionAlertForm";
import { AuctionAlertsList } from "@/components/AuctionAlertsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Auction {
  id: string;
  listing_id: string;
  starting_price: number;
  current_bid: number | null;
  highest_bidder_id: string | null;
  bid_increment: number;
  end_time: string;
  status: string;
}

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
  category_id?: string;
  category: {
    name: string;
  };
  profiles?: {
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidsCount, setBidsCount] = useState(0);

  useEffect(() => {
    fetchListing();
    fetchAuction();
    incrementViews();
    checkFavoriteStatus();
  }, [id]);

  useEffect(() => {
    if (listing) {
      fetchSimilarListings();
    }
  }, [listing]);

  useEffect(() => {
    if (auction) {
      // Subscribe to auction updates
      const channel = supabase
        .channel(`auction-${auction.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auctions',
            filter: `id=eq.${auction.id}`
          },
          () => {
            fetchAuction();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bids',
            filter: `auction_id=eq.${auction.id}`
          },
          () => {
            fetchAuction();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [auction?.id]);

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

  const fetchAuction = async () => {
    try {
      const { data: auctionData, error } = await supabase
        .from("auctions")
        .select("*")
        .eq("listing_id", id)
        .eq("status", "active")
        .maybeSingle();

      if (auctionData) {
        setAuction(auctionData);
        
        // Get bids count
        const { count } = await supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("auction_id", auctionData.id);
        
        setBidsCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching auction:", error);
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

  const fetchSimilarListings = async () => {
    if (!listing?.category_id) return;
    
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          location,
          images,
          views,
          created_at,
          user_id,
          description,
          category:categories(name)
        `)
        .eq("status", "active")
        .eq("category_id", listing.category_id)
        .neq("id", id)
        .limit(4);

      if (error) throw error;
      setSimilarListings(data as any || []);
    } catch (error) {
      console.error("Error fetching similar listings:", error);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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
                          <div 
                            className="aspect-[4/3] bg-gray-50 relative cursor-pointer group"
                            onClick={() => openLightbox(index)}
                          >
                            <img
                              src={image}
                              alt={`${listing.title} - صورة ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                            {/* Zoom Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <Maximize2 className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
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
                        onClick={() => openLightbox(index)}
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
                      <div 
                        onClick={() => openLightbox(5)}
                        className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-qultura-blue transition-all"
                      >
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
                {auction ? (
                  // Auction Information
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary/30">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🔥</span>
                        <h3 className="text-xl font-bold text-primary">هذا المنتج في مزاد مباشر!</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">السعر الابتدائي</p>
                          <p className="text-lg font-bold text-foreground">
                            {auction.starting_price.toLocaleString('ar-SA')} ريال
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">العرض الحالي</p>
                          <p className="text-2xl font-bold text-primary">
                            {auction.current_bid
                              ? `${auction.current_bid.toLocaleString('ar-SA')} ريال`
                              : "لا توجد عروض بعد"
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>👥</span>
                          <span>{bidsCount} عرض</span>
                        </div>
                      </div>

                      <AuctionTimer endTime={auction.end_time} />
                    </div>
                  </div>
                ) : (
                  // Regular Price
                  <p className="text-4xl font-bold text-qultura-blue">
                    {listing.price.toLocaleString('ar-SA')} ريال
                  </p>
                )}
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
          <div className="lg:sticky lg:top-4 h-fit space-y-4">
            {auction ? (
              // Auction Bidding Section
              <>
                <BidForm
                  auctionId={auction.id}
                  currentBid={auction.current_bid}
                  startingPrice={auction.starting_price}
                  bidIncrement={auction.bid_increment}
                  onBidPlaced={fetchAuction}
                />
                
                <AutoBidSettings
                  auctionId={auction.id}
                  minBidAmount={auction.current_bid 
                    ? auction.current_bid + auction.bid_increment 
                    : auction.starting_price
                  }
                />

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">سجل المزايدات</h3>
                  <AuctionBidsList 
                    auctionId={auction.id}
                    startingPrice={auction.starting_price}
                    highestBidderId={auction.highest_bidder_id || undefined}
                  />
                </Card>
              </>
            ) : (
              // Regular Seller Contact Section
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
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarListings.length > 0 && (
          <div className="container mx-auto px-4 py-12 max-w-7xl">
            <h2 className="text-2xl font-bold mb-6">منتجات مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarListings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  location={item.location}
                  time={item.created_at}
                  image={item.images?.[0] || "/placeholder.svg"}
                  category={item.category?.name || "غير محدد"}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {listing && listing.images && (
        <ImageLightbox
          images={listing.images}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default ListingDetails;
