import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Tag, TrendingUp, User, Calendar, Gavel } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import AuctionTimer from "@/components/AuctionTimer";
import BidForm from "@/components/BidForm";
import AuctionBidsList from "@/components/AuctionBidsList";
import ImageLightbox from "@/components/ImageLightbox";

interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  category_id: string | null;
  starting_price: number;
  current_bid: number | null;
  bid_increment: number;
  reserve_price: number | null;
  end_time: string;
  status: string;
  user_id: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  user_id: string;
  is_autobid: boolean;
}

const AuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchAuctionDetails();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchAuctionDetails = async () => {
    try {
      // Fetch auction
      const { data: auctionData, error: auctionError } = await supabase
        .from("auctions")
        .select("*")
        .eq("id", id)
        .single();

      if (auctionError) throw auctionError;

      setAuction(auctionData);

      // Fetch category if exists
      if (auctionData.category_id) {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", auctionData.category_id)
          .single();

        if (categoryData) setCategory(categoryData);
      }

      // Fetch bids
      const { data: bidsData } = await supabase
        .from("bids")
        .select("*")
        .eq("auction_id", id)
        .order("created_at", { ascending: false });

      if (bidsData) setBids(bidsData);
    } catch (error) {
      console.error("Error fetching auction:", error);
      toast.error("فشل تحميل تفاصيل المزاد");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">المزاد غير موجود</h1>
          <Button onClick={() => navigate("/auctions")}>
            العودة للمزادات
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === auction.user_id;
  const isActive = auction.status === "active" && new Date(auction.end_time) > new Date();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/auctions")}
          className="mb-6"
        >
          ← العودة للمزادات
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {auction.images && auction.images.length > 0 ? (
              <Card className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="w-full h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImageIndex(0)}
                  />
                  {auction.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {auction.images.slice(1).map((image, index) => (
                        <img
                          key={index + 1}
                          src={image}
                          alt={`${auction.title} ${index + 2}`}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImageIndex(index + 1)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center bg-muted/50">
                <p className="text-muted-foreground">لا توجد صور للمزاد</p>
              </Card>
            )}

            {/* Details */}
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {category && (
                      <Badge variant="secondary" className="text-sm">
                        {category.name}
                      </Badge>
                    )}
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {isActive ? "مزاد نشط" : "مزاد منتهي"}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>
                  {auction.description && (
                    <p className="text-muted-foreground">{auction.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm">السعر الابتدائي</span>
                    </div>
                    <p className="text-xl font-bold">
                      {auction.starting_price.toLocaleString("ar-SA")} ريال
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">الحد الأدنى للزيادة</span>
                    </div>
                    <p className="text-xl font-bold">
                      {auction.bid_increment.toLocaleString("ar-SA")} ريال
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gavel className="h-4 w-4" />
                      <span className="text-sm">عدد المزايدات</span>
                    </div>
                    <p className="text-xl font-bold">{bids.length}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">تاريخ النشر</span>
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(auction.created_at), "PPp", { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bids History */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                سجل المزايدات
              </h2>
              <AuctionBidsList auctionId={auction.id} />
            </Card>
          </div>

          {/* Sidebar - Left Side */}
          <div className="space-y-6">
            {/* Timer and Current Bid */}
            <Card className="p-6 sticky top-4">
              <div className="space-y-6">
                {isActive && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">الوقت المتبقي</span>
                    </div>
                    <AuctionTimer endTime={auction.end_time} />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">السعر الحالي</span>
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {auction.current_bid
                      ? auction.current_bid.toLocaleString("ar-SA")
                      : auction.starting_price.toLocaleString("ar-SA")}{" "}
                    ريال
                  </p>
                  {!auction.current_bid && (
                    <p className="text-sm text-muted-foreground mt-1">
                      لا توجد مزايدات بعد
                    </p>
                  )}
                </div>

                {auction.reserve_price && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      السعر المحجوز: {auction.reserve_price.toLocaleString("ar-SA")} ريال
                    </p>
                  </div>
                )}

                {/* Bid Form */}
                {isActive && !isOwner && currentUser && (
                  <div className="border-t pt-6">
                    <BidForm
                      auctionId={auction.id}
                      currentBid={auction.current_bid}
                      startingPrice={auction.starting_price}
                      bidIncrement={auction.bid_increment}
                      onBidPlaced={fetchAuctionDetails}
                    />
                  </div>
                )}

                {isActive && !isOwner && !currentUser && (
                  <div className="border-t pt-6">
                    <p className="text-center text-muted-foreground mb-4">
                      يجب تسجيل الدخول للمزايدة
                    </p>
                    <Button
                      onClick={() => navigate("/auth")}
                      className="w-full"
                    >
                      تسجيل الدخول
                    </Button>
                  </div>
                )}

                {isOwner && (
                  <div className="border-t pt-6">
                    <p className="text-center text-muted-foreground text-sm">
                      هذا المزاد خاص بك
                    </p>
                  </div>
                )}

                {!isActive && (
                  <div className="border-t pt-6">
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      المزاد منتهي
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Auction Info */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">معلومات إضافية</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">رقم المزاد</span>
                  <span className="font-medium">{auction.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ البدء</span>
                  <span className="font-medium">
                    {format(new Date(auction.created_at), "PP", { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ الانتهاء</span>
                  <span className="font-medium">
                    {format(new Date(auction.end_time), "PP", { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الحالة</span>
                  <span className="font-medium">
                    {isActive ? "نشط" : "منتهي"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && auction.images && (
        <ImageLightbox
          images={auction.images}
          initialIndex={selectedImageIndex}
          open={true}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
};

export default AuctionDetails;
