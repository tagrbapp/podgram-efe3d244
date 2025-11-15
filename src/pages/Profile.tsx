import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ListingCard from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";
import { User, Phone, Calendar, MapPin, MessageSquare, Package, TrendingUp, Eye, Star, ArrowRight, ShieldCheck, Flag, StarIcon, Clock, Zap, BarChart, Reply } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  views: number;
  created_at: string;
  images: string[] | null;
  categories: {
    name: string;
  } | null;
}

interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  seller_reply: string | null;
  replied_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [stats, setStats] = useState({ responseRate: 0, avgResponseTime: 0, completionRate: 0, totalSales: 0 });

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getSession();
      setCurrentUserId(user?.id || null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchListings();
      fetchReviews();
      checkVerificationStatus();
      fetchSellerStats();
    }
  }, [id]);

  const fetchSellerStats = async () => {
    if (!id) return;
    
    const { getSellerStats } = await import("@/lib/stats");
    const statsData = await getSellerStats(id);
    setStats(statsData);
  };

  const fetchProfile = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error("فشل في جلب بيانات المستخدم");
      navigate("/");
      return;
    }

    setProfile(data);
  };

  const fetchListings = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        status,
        views,
        created_at,
        images,
        categories (
          name
        )
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("فشل في جلب الإعلانات");
      setIsLoading(false);
      return;
    }

    setListings(data || []);
    setIsLoading(false);
  };

  const fetchReviews = async () => {
    if (!id) return;

    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select("id, reviewer_id, seller_id, rating, comment, seller_reply, replied_at, created_at")
      .eq("seller_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }

    if (!reviewsData) {
      setReviews([]);
      return;
    }

    // Fetch profiles for reviewers
    const reviewerIds = reviewsData.map(r => r.reviewer_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", reviewerIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const enrichedReviews = reviewsData.map(review => ({
      ...review,
      profiles: profilesMap.get(review.reviewer_id) || { full_name: "مستخدم", avatar_url: null }
    }));

    setReviews(enrichedReviews);
    
    // Calculate average rating
    if (reviewsData.length > 0) {
      const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
      setAverageRating(Math.round(avg * 10) / 10);
    }
  };

  const checkVerificationStatus = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", id)
      .eq("status", "sold");

    if (!error && data && data.length >= 20) {
      setIsVerified(true);
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

      if (user.id === id) {
        toast.error("لا يمكنك مراسلة نفسك");
        return;
      }

      if (listings.length === 0) {
        toast.error("لا توجد إعلانات نشطة لهذا البائع");
        return;
      }

      const firstListing = listings[0];

      const { data: existingConv, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", firstListing.id)
        .eq("buyer_id", user.id)
        .eq("seller_id", id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingConv) {
        navigate("/messages");
        return;
      }

      const { error: createError } = await supabase
        .from("conversations")
        .insert({
          listing_id: firstListing.id,
          buyer_id: user.id,
          seller_id: id,
        });

      if (createError) throw createError;

      toast.success("تم بدء المحادثة");
      navigate("/messages");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("فشل في بدء المحادثة");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  const getMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", { year: 'numeric', month: 'long' });
  };

  const handleSubmitReport = async () => {
    if (!currentUserId || !id) {
      toast.error("يجب تسجيل الدخول");
      return;
    }

    if (!reportReason || !reportDescription) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: currentUserId,
        reported_user_id: id,
        reason: reportReason,
        description: reportDescription,
      });

    if (error) {
      toast.error("فشل في إرسال البلاغ");
      return;
    }

    toast.success("تم إرسال البلاغ بنجاح");
    setIsReportDialogOpen(false);
    setReportReason("");
    setReportDescription("");
  };

  const handleSubmitReview = async () => {
    if (!currentUserId || !id) {
      toast.error("يجب تسجيل الدخول");
      return;
    }

    if (!reviewComment) {
      toast.error("يرجى كتابة تعليق");
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: currentUserId,
        seller_id: id,
        rating: reviewRating,
        comment: reviewComment,
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("لقد قيمت هذا البائع بالفعل");
      } else {
        toast.error("فشل في إضافة التقييم");
      }
      return;
    }

    toast.success("تم إضافة التقييم بنجاح");
    setIsReviewDialogOpen(false);
    setReviewRating(5);
    setReviewComment("");
    fetchReviews();
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText) {
      toast.error("يرجى كتابة رد");
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .update({
        seller_reply: replyText,
        replied_at: new Date().toISOString(),
      })
      .eq("id", selectedReview.id);

    if (error) {
      toast.error("فشل في إضافة الرد");
      return;
    }

    toast.success("تم إضافة الرد بنجاح");
    setIsReplyDialogOpen(false);
    setReplyText("");
    setSelectedReview(null);
    fetchReviews();
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-${size/4} w-${size/4} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">المستخدم غير موجود</p>
        </div>
      </>
    );
  }

  const isOwnProfile = currentUserId === id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <Card className="p-6 shadow-lg border-0">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  {isVerified && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      موثوق
                    </Badge>
                  )}
                </div>
                
                {averageRating > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {renderStars(Math.round(averageRating), 20)}
                    <span className="text-lg font-semibold">{averageRating}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length} تقييم)</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">عضو منذ {getMemberSince(profile.created_at)}</span>
                </div>

                {!isOwnProfile && (
                  <div className="space-y-2 w-full mt-4">
                    <Button 
                      onClick={handleStartChat}
                      className="w-full bg-gradient-primary hover:opacity-90 shadow-lg"
                      size="lg"
                    >
                      <MessageSquare className="ml-2 h-5 w-5" />
                      راسل البائع
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Star className="ml-2 h-4 w-4" />
                            إضافة تقييم
                          </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader>
                            <DialogTitle>إضافة تقييم للبائع</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>التقييم</Label>
                              <div className="flex gap-2 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`h-8 w-8 ${
                                        star <= reviewRating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-muted text-muted"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="review-comment">التعليق</Label>
                              <Textarea
                                id="review-comment"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="شارك تجربتك مع هذا البائع..."
                                className="mt-2"
                                rows={4}
                              />
                            </div>
                            <Button onClick={handleSubmitReview} className="w-full">
                              إرسال التقييم
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive">
                            <Flag className="ml-2 h-4 w-4" />
                            إبلاغ
                          </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader>
                            <DialogTitle>الإبلاغ عن مستخدم</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="report-reason">السبب</Label>
                              <Select value={reportReason} onValueChange={setReportReason}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="اختر السبب" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spam">محتوى غير مرغوب فيه</SelectItem>
                                  <SelectItem value="fraud">احتيال أو نصب</SelectItem>
                                  <SelectItem value="inappropriate">محتوى غير لائق</SelectItem>
                                  <SelectItem value="fake">حساب وهمي</SelectItem>
                                  <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="report-description">التفاصيل</Label>
                              <Textarea
                                id="report-description"
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="اشرح المشكلة بالتفصيل..."
                                className="mt-2"
                                rows={4}
                              />
                            </div>
                            <Button onClick={handleSubmitReport} className="w-full" variant="destructive">
                              إرسال البلاغ
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <Link to="/settings" className="w-full">
                    <Button 
                      variant="outline"
                      className="w-full mt-4"
                      size="lg"
                    >
                      تعديل الملف الشخصي
                    </Button>
                  </Link>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">الاسم</p>
                    <p className="font-medium">{profile.full_name}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium" dir="ltr">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 shadow-lg border-0">
              <h2 className="text-lg font-semibold mb-4">الإحصائيات</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">إعلانات نشطة</span>
                  </div>
                  <span className="text-xl font-bold">{activeListings.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">إعلانات مباعة</span>
                  </div>
                  <span className="text-xl font-bold">{soldListings.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">إجمالي المشاهدات</span>
                  </div>
                  <span className="text-xl font-bold">{totalViews}</span>
                </div>
              </div>
            </Card>

            {/* Advanced Seller Statistics */}
            <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                إحصائيات البائع المتقدمة
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/80 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">معدل الاستجابة</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{stats.responseRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all" 
                      style={{ width: `${stats.responseRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/80 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">وقت الرد المتوسط</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.avgResponseTime < 60 
                        ? `${Math.round(stats.avgResponseTime)} دقيقة`
                        : stats.avgResponseTime < 1440
                        ? `${Math.round(stats.avgResponseTime / 60)} ساعة`
                        : `${Math.round(stats.avgResponseTime / 1440)} يوم`
                      }
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/80 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">نسبة إتمام الصفقات</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/80 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">إجمالي المبيعات</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{stats.totalSales}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Listings Section */}
          <div className="md:col-span-2">
            <Card className="shadow-lg border-0">
              <div className="p-6 border-b bg-gradient-to-r from-card to-card/80">
                <h2 className="text-2xl font-bold">
                  إعلانات {isOwnProfile ? "الخاصة بك" : profile.full_name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {listings.length} إعلان
                </p>
              </div>

              <div className="p-6">
                {listings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                      لا توجد إعلانات
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      {isOwnProfile ? "ابدأ بإضافة إعلانك الأول" : "لم يتم نشر أي إعلانات بعد"}
                    </p>
                    {isOwnProfile && (
                      <Link to="/add-listing">
                        <Button className="mt-6 bg-gradient-secondary hover:opacity-90">
                          أضف إعلان جديد
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue="active" dir="rtl">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="active">
                        النشطة ({activeListings.length})
                      </TabsTrigger>
                      <TabsTrigger value="all">
                        الكل ({listings.length})
                      </TabsTrigger>
                      <TabsTrigger value="reviews">
                        التقييمات ({reviews.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      <div className="grid md:grid-cols-2 gap-6">
                        {activeListings.map((listing) => (
                          <ListingCard 
                            key={listing.id} 
                            id={listing.id}
                            title={listing.title}
                            price={listing.price}
                            location={listing.location}
                            time={new Date(listing.created_at).toLocaleDateString('ar-SA')}
                            image={listing.images?.[0] || "/placeholder.svg"}
                            category={listing.categories?.name || "غير محدد"}
                          />
                        ))}
                      </div>
                      {activeListings.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">لا توجد إعلانات نشطة</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="all">
                      <div className="grid md:grid-cols-2 gap-6">
                        {listings.map((listing) => (
                          <ListingCard 
                            key={listing.id} 
                            id={listing.id}
                            title={listing.title}
                            price={listing.price}
                            location={listing.location}
                            time={new Date(listing.created_at).toLocaleDateString('ar-SA')}
                            image={listing.images?.[0] || "/placeholder.svg"}
                            category={listing.categories?.name || "غير محدد"}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <Star className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                          <p className="text-lg font-medium text-muted-foreground">
                            لا توجد تقييمات بعد
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <Card key={review.id} className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.profiles.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                    {getInitials(review.profiles.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-semibold">{review.profiles.full_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString('ar-SA', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                    {renderStars(review.rating, 16)}
                                  </div>
                                  {review.comment && (
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                                      {review.comment}
                                    </p>
                                  )}
                                  
                                  {/* Seller Reply */}
                                  {review.seller_reply && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border-r-2 border-primary">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Reply className="h-3 w-3 text-primary" />
                                        <span className="text-xs font-semibold text-primary">رد البائع</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {review.seller_reply}
                                      </p>
                                      {review.replied_at && (
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                          {new Date(review.replied_at).toLocaleDateString('ar-SA')}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Reply Button for Seller */}
                                  {isOwnProfile && !review.seller_reply && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-primary"
                                      onClick={() => {
                                        setSelectedReview(review);
                                        setIsReplyDialogOpen(true);
                                      }}
                                    >
                                      <Reply className="ml-1 h-3 w-3" />
                                      رد على التقييم
                                    </Button>
                                  )}
      </div>
      
      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>الرد على التقييم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold">{selectedReview.profiles.full_name}</p>
                  {renderStars(selectedReview.rating, 14)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedReview.comment}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="reply-text">ردك</Label>
              <Textarea
                id="reply-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك على التقييم..."
                className="mt-2"
                rows={4}
              />
            </div>
            <Button onClick={handleSubmitReply} className="w-full">
              إرسال الرد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
