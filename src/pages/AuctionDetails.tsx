import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Tag, TrendingUp, User, Calendar, Gavel, ArrowLeft, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import AuctionTimer from "@/components/AuctionTimer";
import BidForm from "@/components/BidForm";
import AuctionBidsList from "@/components/AuctionBidsList";
import ImageLightbox from "@/components/ImageLightbox";
import AuctionShareButtons from "@/components/AuctionShareButtons";
import { useAuctionRealtime } from "@/hooks/useAuctionRealtime";
import AuctionAlertSettings from "@/components/AuctionAlertSettings";
import SimilarAuctions from "@/components/SimilarAuctions";
import AuctionSellerSidebar from "@/components/AuctionSellerSidebar";
import { BidderReviewForm } from "@/components/BidderReviewForm";
import { AuctionReportDialog } from "@/components/AuctionReportDialog";
import SEO from "@/components/SEO";
import AuctionSchema from "@/components/AuctionSchema";
import AuctionExtendedAlert from "@/components/AuctionExtendedAlert";
import { AuctionAdminAnalytics } from "@/components/AuctionAdminAnalytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

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
  highest_bidder_id: string | null;
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
  const [userHasBid, setUserHasBid] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showExtendedAlert, setShowExtendedAlert] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    // Check if user is admin or moderator
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);
      
      setIsAdmin(roles && roles.length > 0);
    }
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
      
      // Check if auction is deleted
      if (auctionData.deleted_at) {
        toast.error("هذا المزاد تم حذفه من قبل الإدارة");
        navigate("/auctions");
        return;
      }

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

      if (bidsData) {
        setBids(bidsData);
        // Check if current user has bid
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const hasBid = bidsData.some(bid => bid.user_id === user.id);
          setUserHasBid(hasBid);
        }
      }
    } catch (error) {
      console.error("Error fetching auction:", error);
      toast.error("فشل تحميل تفاصيل المزاد");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionDetails();
    checkUser();
  }, [id]);

  // الاستماع لإشعارات تمديد المزاد
  useEffect(() => {
    if (!currentUser || !id) return;

    const channel = supabase
      .channel(`auction-extended-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload: any) => {
          const notification = payload.new;
          if (notification.type === 'auction_extended') {
            setShowExtendedAlert(true);
            fetchAuctionDetails(); // تحديث البيانات
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUser]);

  // Use realtime hook for live updates
  useAuctionRealtime(id || "", fetchAuctionDetails);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background">
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

  const handleDeleteAuction = async () => {
    if (!deleteReason.trim()) {
      toast.error("يرجى إدخال سبب الحذف");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_auction", {
        _admin_id: currentUser?.id,
        _auction_id: auction.id,
        _reason: deleteReason,
      });

      if (error) throw error;

      toast.success("تم حذف المزاد بنجاح");
      navigate("/auctions");
    } catch (error) {
      console.error("Error deleting auction:", error);
      toast.error("فشل حذف المزاد");
    } finally {
      setIsDeleting(false);
      setDeleteReason("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${auction.title} - مزاد مباشر | Podgram`}
        description={auction.description || `شارك في مزاد ${auction.title}. السعر الحالي: ${auction.current_bid || auction.starting_price} ريال. مزادات المنتجات الفاخرة.`}
        keywords={`مزاد ${auction.title}, ${category?.name || ''}, مزادات, منتجات فاخرة`}
        image={auction.images?.[0]}
        type="product"
      />
      <AuctionSchema 
        name={auction.title}
        description={auction.description || undefined}
        image={auction.images || undefined}
        startingPrice={auction.starting_price}
        currentBid={auction.current_bid || undefined}
        priceCurrency="SAR"
        auctionStart={auction.created_at}
        auctionEnd={auction.end_time}
        category={category?.name}
        url={`https://podgram.lovable.app/auction/${auction.id}`}
        status={auction.status as 'active' | 'ended'}
      />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "المزادات", href: "/auctions" },
            { label: auction.title }
          ]}
        />
        
        {/* Enhanced Header with Back button, Share button, Report, and Admin Delete */}
        <div className="flex items-center justify-between mb-8 bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
          <Button
            variant="ghost"
            onClick={() => navigate("/auctions")}
            className="gap-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للمزادات
          </Button>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    حذف المزاد
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد حذف المزاد</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>هل أنت متأكد من حذف هذا المزاد؟ سيتم إخفاؤه من المنصة وإرسال إشعار للبائع.</p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">سبب الحذف (مطلوب)</label>
                        <Textarea
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="أدخل سبب حذف المزاد..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAuction}
                      disabled={isDeleting || !deleteReason.trim()}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? "جاري الحذف..." : "حذف المزاد"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!isOwner && currentUser && (
              <AuctionReportDialog 
                auctionId={auction.id}
                sellerId={auction.user_id}
              />
            )}
            <AuctionShareButtons 
              auctionId={auction.id} 
              title={auction.title}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Images with gradient overlay */}
            {auction.images && auction.images.length > 0 ? (
              <Card className="overflow-hidden border-2 border-border/50 shadow-xl">
                <div className="grid grid-cols-1 gap-4 p-6">
                  <div className="relative group">
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className="w-full h-96 object-cover rounded-xl cursor-pointer transition-all duration-300 group-hover:scale-105"
                      onClick={() => setSelectedImageIndex(0)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {auction.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {auction.images.slice(1).map((image, index) => (
                        <div key={index + 1} className="relative group">
                          <img
                            src={image}
                            alt={`${auction.title} ${index + 2}`}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                            onClick={() => setSelectedImageIndex(index + 1)}
                          />
                          <div className="absolute inset-0 bg-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/50 border-2 border-dashed">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">لا توجد صور للمزاد</p>
              </Card>
            )}

            {/* Enhanced Details Card */}
            <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-2 border-border/50 shadow-lg">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {category && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <Tag className="h-3 w-3 ml-1" />
                        {category.name}
                      </Badge>
                    )}
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={`text-sm px-3 py-1 ${isActive ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}`}
                    >
                      <Gavel className="h-3 w-3 ml-1" />
                      {isActive ? "مزاد نشط" : "مزاد منتهي"}
                    </Badge>
                    {isActive && (
                      <Badge variant="outline" className="text-sm px-3 py-1 border-green-500 text-green-600">
                        مباشر
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {auction.title}
                  </h1>
                  {auction.description && (
                    <p className="text-muted-foreground text-lg leading-relaxed">{auction.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm">السعر الابتدائي</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {auction.starting_price.toLocaleString("en-US")} <span className="text-sm">ريال</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">الحد الأدنى للزيادة</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {auction.bid_increment.toLocaleString("en-US")} <span className="text-sm">ريال</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Gavel className="h-4 w-4" />
                      <span className="text-sm">عدد المزايدات</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{bids.length}</p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">تاريخ النشر</span>
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(auction.created_at), "PPp")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Admin Analytics Section */}
            {isAdmin && (
              <AuctionAdminAnalytics 
                auctionId={auction.id}
                auction={auction}
                bids={bids}
              />
            )}

            {/* Bids History */}
            <Card className="p-6">
              <AuctionBidsList 
                auctionId={auction.id}
                startingPrice={auction.starting_price}
                highestBidderId={auction.highest_bidder_id || undefined}
              />
            </Card>

            {/* Enhanced Auction Info Card */}
            <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-border/50">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                معلومات إضافية
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">رقم المزاد</span>
                  <span className="font-mono font-bold">{auction.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">تاريخ البدء</span>
                  <span className="font-medium">
                    {format(new Date(auction.created_at), "PP")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">تاريخ الانتهاء</span>
                  <span className="font-medium">
                    {format(new Date(auction.end_time), "PP")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">الحالة</span>
                  <Badge variant={isActive ? "default" : "secondary"} className="font-medium">
                    {isActive ? "نشط" : "منتهي"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Alert Settings */}
            {isActive && (
              <AuctionAlertSettings
                auctionId={auction.id}
                currentUserId={currentUser?.id}
              />
            )}

            {/* Review Form - Only for bidders after auction ends */}
            {!isActive && !isOwner && userHasBid && auction.highest_bidder_id && currentUser && (
              <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">تقييم المزاد</h3>
                    <p className="text-sm text-muted-foreground">
                      ساعد الآخرين من خلال تقييم تجربتك
                    </p>
                  </div>
                  {!showReviewForm && (
                    <Button 
                      onClick={() => setShowReviewForm(true)}
                      variant="outline"
                    >
                      إضافة تقييم
                    </Button>
                  )}
                </div>
                {showReviewForm && (
                  <BidderReviewForm
                    auctionId={auction.id}
                    bidderId={auction.highest_bidder_id}
                    bidderName="الفائز بالمزاد"
                    onSubmit={() => {
                      setShowReviewForm(false);
                      toast.success("شكراً لتقييمك!");
                    }}
                  />
                )}
              </Card>
            )}

            {/* Similar Auctions */}
            <SimilarAuctions
              categoryId={auction.category_id}
              currentAuctionId={auction.id}
            />
          </div>

          {/* Enhanced Sidebar - Left Side */}
          <div className="space-y-6">
            {/* Seller Information */}
            <AuctionSellerSidebar sellerId={auction.user_id} />
            {/* Enhanced Timer and Current Bid Card */}
            <Card className="p-6 sticky top-4 bg-gradient-to-br from-card via-card to-primary/5 border-2 border-border/50 shadow-2xl">
              <div className="space-y-6">
                {isActive && (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                      <Clock className="h-5 w-5 animate-pulse" />
                      <span className="text-sm font-medium">الوقت المتبقي</span>
                    </div>
                    <AuctionTimer endTime={auction.end_time} />
                  </div>
                )}

                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span className="text-sm text-muted-foreground font-medium">السعر الحالي</span>
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-6 border border-primary/20">
                    <p className="text-5xl font-bold text-foreground">
                      {auction.current_bid
                        ? auction.current_bid.toLocaleString("en-US")
                        : auction.starting_price.toLocaleString("en-US")}
                    </p>
                    <p className="text-xl font-bold text-muted-foreground mt-2">ريال</p>
                  </div>
                  {!auction.current_bid && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
                      <Gavel className="h-4 w-4" />
                      لا توجد مزايدات بعد - كن الأول!
                    </p>
                  )}
                </div>

                {auction.reserve_price && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      السعر المحجوز: {auction.reserve_price.toLocaleString("en-US")} ريال
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

      {/* Auction Extended Alert */}
      <AuctionExtendedAlert
        show={showExtendedAlert}
        onClose={() => setShowExtendedAlert(false)}
      />
    </div>
  );
};

export default AuctionDetails;
