import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gavel, TrendingUp, Timer, DollarSign, Plus, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { convertArabicToEnglishNumbers } from "@/lib/utils";
import { AccountApprovalBanner } from "@/components/AccountApprovalBanner";
import { MembershipUpgradeDialog } from "@/components/MembershipUpgradeDialog";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Auction {
  id: string;
  listing_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  images: string[] | null;
  starting_price: number;
  current_bid: number | null;
  bid_increment: number;
  end_time: string;
  status: string;
  bids_count: number;
}

const DashboardAuctions = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [auctionTitle, setAuctionTitle] = useState<string>("");
  const [auctionDescription, setAuctionDescription] = useState<string>("");
  const [startingPrice, setStartingPrice] = useState<string>("");
  const [bidIncrement, setBidIncrement] = useState<string>("100");
  const [reservePrice, setReservePrice] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check approval status and membership type
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status, membership_type")
        .eq("id", user.id)
        .single();

      if (profile) {
        setApprovalStatus(profile.approval_status);
        setMembershipType(profile.membership_type);
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, icon')
        .order('name');

      // Fetch user's auctions
      const { data: auctionsData } = await supabase
        .from('auctions')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Get bid counts for each auction
      if (auctionsData) {
        const auctionsWithCounts = await Promise.all(
          auctionsData.map(async (auction) => {
            const { count } = await supabase
              .from('bids')
              .select('*', { count: 'exact', head: true })
              .eq('auction_id', auction.id);

            return {
              ...auction,
              bids_count: count || 0
            };
          })
        );
        setAuctions(auctionsWithCounts);
      }

      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("فشل تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedImages.length + files.length > 5) {
      toast.error("يمكنك رفع 5 صور كحد أقصى");
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      toast.error("نوع الصورة يجب أن يكون JPG أو PNG أو WEBP");
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${userId}/auctions/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is consumer
    if (membershipType === "consumer") {
      setShowUpgradeDialog(true);
      return;
    }

    if (!selectedCategory || !auctionTitle || !startingPrice || !endTime) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    // Check approval status
    if (approvalStatus !== "approved") {
      toast.error("يجب الموافقة على حسابك أولاً لإنشاء مزادات");
      return;
    }

    const endDate = new Date(endTime);
    const now = new Date();
    
    if (endDate <= now) {
      toast.error("تاريخ النهاية يجب أن يكون في المستقبل");
      return;
    }

    // Check if auction duration exceeds 5 days
    const maxDuration = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
    const duration = endDate.getTime() - now.getTime();
    
    if (duration > maxDuration) {
      toast.error("مدة المزاد يجب أن لا تتجاوز 5 أيام");
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        toast.info("جاري رفع الصور...");
        imageUrls = await uploadImages(user?.id || '');
      }
      
      const { error } = await supabase.from('auctions').insert({
        user_id: user?.id,
        category_id: selectedCategory,
        title: auctionTitle,
        description: auctionDescription || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        starting_price: parseFloat(startingPrice),
        bid_increment: parseFloat(bidIncrement),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        end_time: endDate.toISOString(),
        status: 'active'
      });

      if (error) throw error;

      toast.success("تم إنشاء المزاد بنجاح! 🎉");
      
      // Reset form
      setSelectedCategory("");
      setAuctionTitle("");
      setAuctionDescription("");
      setStartingPrice("");
      setBidIncrement("100");
      setReservePrice("");
      setEndTime("");
      setSelectedImages([]);
      setImagePreviews([]);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error("Error creating auction:", error);
      toast.error("فشل إنشاء المزاد", {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
      setUploadingImages(false);
    }
  };

  const handleEndAuction = async (auctionId: string) => {
    const { error } = await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auctionId);

    if (error) {
      toast.error("فشل إنهاء المزاد");
      return;
    }

    toast.success("تم إنهاء المزاد");
    fetchData();
  };

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    totalBids: auctions.reduce((sum, a) => sum + a.bids_count, 0),
    avgBidsPerAuction: auctions.length > 0 
      ? (auctions.reduce((sum, a) => sum + a.bids_count, 0) / auctions.length).toFixed(1)
      : 0
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-lg">جاري التحميل...</p>
            </div>
          </div>
          <div className="order-1">
            <AppSidebar />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <MembershipUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onSuccess={() => {
          fetchData();
        }}
      />
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold mr-4">إدارة المزادات</h1>
          </header>
          <main className="p-6" dir="rtl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                إدارة المزادات
              </h1>
              <p className="text-muted-foreground">
                أنشئ وأدر مزادات منتجاتك الفاخرة
              </p>
            </div>

            <AccountApprovalBanner />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Gavel className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المزادات</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Timer className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المزادات النشطة</p>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي العروض</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalBids}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط العروض</p>
                    <p className="text-2xl font-bold text-foreground">{stats.avgBidsPerAuction}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Create Auction Form */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                إنشاء مزاد جديد
              </h2>

              <form onSubmit={handleCreateAuction} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">تحديد الفئة *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auctionTitle">عنوان المزاد *</Label>
                    <Input
                      id="auctionTitle"
                      value={auctionTitle}
                      onChange={(e) => setAuctionTitle(e.target.value)}
                      placeholder="مثال: ساعة رولكس نادرة"
                      className="text-right"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startingPrice">السعر الابتدائي (ريال)</Label>
                    <Input
                      id="startingPrice"
                      type="text"
                      inputMode="decimal"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(convertArabicToEnglishNumbers(e.target.value))}
                      placeholder="1000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bidIncrement">الحد الأدنى للزيادة (ريال)</Label>
                    <Input
                      id="bidIncrement"
                      type="text"
                      inputMode="decimal"
                      value={bidIncrement}
                      onChange={(e) => setBidIncrement(convertArabicToEnglishNumbers(e.target.value))}
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reservePrice">السعر المحجوز (اختياري)</Label>
                    <Input
                      id="reservePrice"
                      type="text"
                      inputMode="decimal"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(convertArabicToEnglishNumbers(e.target.value))}
                      placeholder="5000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="auctionDescription">وصف المزاد</Label>
                    <Input
                      id="auctionDescription"
                      value={auctionDescription}
                      onChange={(e) => setAuctionDescription(e.target.value)}
                      placeholder="أضف وصفاً تفصيلياً للمزاد"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endTime">تاريخ ووقت النهاية</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>صور المزاد (حتى 5 صور)</Label>
                    
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`معاينة ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedImages.length < 5 && (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-smooth cursor-pointer">
                        <input
                          type="file"
                          id="auction-image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <label htmlFor="auction-image-upload" className="cursor-pointer">
                          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-1">
                            انقر لاختيار الصور
                          </p>
                          <p className="text-xs text-muted-foreground">
                            الحد الأقصى 5 صور، كل صورة حتى 5MB
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WEBP
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || uploadingImages || categories.length === 0}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  {uploadingImages ? "جاري رفع الصور..." : isCreating ? "جاري الإنشاء..." : "إنشاء المزاد"}
                </Button>
              </form>
            </Card>

            {/* Auctions Table */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                المزادات الحالية
              </h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>السعر الابتدائي</TableHead>
                      <TableHead>العرض الحالي</TableHead>
                      <TableHead>عدد العروض</TableHead>
                      <TableHead>تاريخ النهاية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          جاري التحميل...
                        </TableCell>
                      </TableRow>
                    ) : auctions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد مزادات بعد
                        </TableCell>
                      </TableRow>
                    ) : (
                      auctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {auction.images && auction.images[0] && (
                                <img
                                  src={auction.images[0]}
                                  alt={auction.title}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <span className="font-medium">{auction.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{auction.starting_price.toLocaleString("en-US")} ريال</TableCell>
                          <TableCell className="font-bold text-primary">
                            {auction.current_bid 
                              ? `${auction.current_bid.toLocaleString("en-US")} ريال`
                              : "لا توجد عروض"
                            }
                          </TableCell>
                          <TableCell>{auction.bids_count}</TableCell>
                          <TableCell>
                            {format(new Date(auction.end_time), "PPp")}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              auction.status === 'active' 
                                ? 'bg-accent/20 text-accent'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {auction.status === 'active' ? 'نشط' : 'منتهي'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/auction/${auction.id}`)}
                              >
                                عرض
                              </Button>
                              {auction.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleEndAuction(auction.id)}
                                >
                                  إنهاء
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardAuctions;