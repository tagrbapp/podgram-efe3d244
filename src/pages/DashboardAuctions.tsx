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
import { Gavel, TrendingUp, Timer, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { convertArabicToEnglishNumbers } from "@/lib/utils";

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

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [auctionTitle, setAuctionTitle] = useState<string>("");
  const [auctionDescription, setAuctionDescription] = useState<string>("");
  const [startingPrice, setStartingPrice] = useState<string>("");
  const [bidIncrement, setBidIncrement] = useState<string>("100");
  const [reservePrice, setReservePrice] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

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

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !auctionTitle || !startingPrice || !endTime) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    const endDate = new Date(endTime);
    if (endDate <= new Date()) {
      toast.error("تاريخ النهاية يجب أن يكون في المستقبل");
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('auctions').insert({
        user_id: user?.id,
        category_id: selectedCategory,
        title: auctionTitle,
        description: auctionDescription || null,
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
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error creating auction:", error);
      toast.error("فشل إنشاء المزاد");
    } finally {
      setIsCreating(false);
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
          <AppSidebar />
          <div className="flex-1 order-2 flex items-center justify-center">
            <div className="text-center">جاري التحميل...</div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <SidebarTrigger className="-ml-2" />
              <h1 className="text-2xl font-bold">إدارة المزادات</h1>
            </div>
          </header>
          <main className="container mx-auto p-6" dir="rtl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                إدارة المزادات
              </h1>
              <p className="text-muted-foreground">
                أنشئ وأدر مزادات منتجاتك الفاخرة
              </p>
            </div>

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
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || categories.length === 0}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  {isCreating ? "جاري الإنشاء..." : "إنشاء المزاد"}
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
                          <TableCell>{auction.starting_price.toLocaleString("ar-SA")} ريال</TableCell>
                          <TableCell className="font-bold text-primary">
                            {auction.current_bid 
                              ? `${auction.current_bid.toLocaleString("ar-SA")} ريال`
                              : "لا توجد عروض"
                            }
                          </TableCell>
                          <TableCell>{auction.bids_count}</TableCell>
                          <TableCell>
                            {format(new Date(auction.end_time), "PPp", { locale: ar })}
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
                              {auction.listing_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/listing/${auction.listing_id}`)}
                                >
                                  عرض
                                </Button>
                              )}
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
      </div>
    </SidebarProvider>
  );
};

export default DashboardAuctions;