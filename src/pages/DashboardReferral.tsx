import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, UserPlus, Gift, TrendingUp, Calendar, Users, CalendarDays } from "lucide-react";
import { format, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

interface ReferredUser {
  id: string;
  full_name: string;
  created_at: string;
}

interface ChartData {
  month: string;
  count: number;
}

type TimePeriod = "3months" | "6months" | "1year" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const DashboardReferral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6months");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [referralStats, setReferralStats] = useState({ 
    total: 0, 
    points: 0,
    thisMonth: 0,
    lastMonth: 0,
    bestMonth: { month: '', count: 0 }
  });
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await loadReferralData(session.user.id);
    };

    checkAuth();
  }, [navigate, timePeriod, dateRange]);

  const loadReferralData = async (userId: string) => {
    try {
      // Get user's referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setReferralCode(profile.referral_code || '');

      // Calculate date range based on selected period
      let startDate: Date;
      const now = new Date();
      
      if (timePeriod === "custom" && dateRange.from && dateRange.to) {
        startDate = startOfDay(dateRange.from);
      } else if (timePeriod === "3months") {
        startDate = subMonths(now, 3);
      } else if (timePeriod === "1year") {
        startDate = subYears(now, 1);
      } else {
        startDate = subMonths(now, 6); // default 6 months
      }

      // Get referral statistics with full details filtered by date
      const { data: referrals, error: referralsError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('referred_by', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      const totalReferrals = referrals?.length || 0;
      setReferredUsers(referrals || []);

      // Calculate monthly statistics
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let thisMonthCount = 0;
      let lastMonthCount = 0;
      const monthlyData: { [key: string]: number } = {};

      referrals?.forEach((ref) => {
        const refDate = new Date(ref.created_at);
        const refMonth = refDate.getMonth();
        const refYear = refDate.getFullYear();
        
        // This month count
        if (refMonth === currentMonth && refYear === currentYear) {
          thisMonthCount++;
        }
        
        // Last month count
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (refMonth === lastMonth && refYear === lastMonthYear) {
          lastMonthCount++;
        }

        // Group by month for chart
        const monthKey = format(refDate, 'yyyy-MM');
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      // Prepare chart data based on selected period
      const chartDataArray: ChartData[] = [];
      const monthsToShow = timePeriod === "3months" ? 3 : timePeriod === "1year" ? 12 : 6;
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = format(date, 'yyyy-MM');
        chartDataArray.push({
          month: format(date, 'MMM yyyy', { locale: ar }),
          count: monthlyData[monthKey] || 0
        });
      }
      setChartData(chartDataArray);

      // Find best month
      let bestMonth = { month: '', count: 0 };
      Object.entries(monthlyData).forEach(([month, count]) => {
        if (count > bestMonth.count) {
          const date = new Date(month + '-01');
          bestMonth = {
            month: format(date, 'MMMM yyyy', { locale: ar }),
            count
          };
        }
      });

      setReferralStats({
        total: totalReferrals,
        points: totalReferrals * 10,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        bestMonth
      });

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error("خطأ في تحميل بيانات الإحالة");
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  const copyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(getReferralUrl());
      toast.success("تم نسخ الرابط!");
    } catch (error) {
      toast.error("فشل نسخ الرابط");
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("تم نسخ الكود!");
    } catch (error) {
      toast.error("فشل نسخ الكود");
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'انضم إلى Podgram',
      text: `استخدم كودي للتسجيل واحصل على منتجات فاخرة! الكود: ${referralCode}`,
      url: getReferralUrl()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyReferralUrl();
        toast.success("تم نسخ رابط الدعوة!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <UserPlus className="h-8 w-8 text-primary" />
                دعوة الأصدقاء
              </h1>
              <p className="text-muted-foreground">
                ادع أصدقاءك واحصل على 10 نقاط لكل صديق يسجل باستخدام كودك
              </p>
            </div>

            {/* Time Period Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  الفترة الزمنية
                </CardTitle>
                <CardDescription>اختر الفترة الزمنية لعرض الإحصائيات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="3months">3 أشهر</TabsTrigger>
                    <TabsTrigger value="6months">6 أشهر</TabsTrigger>
                    <TabsTrigger value="1year">سنة</TabsTrigger>
                    <TabsTrigger value="custom">نطاق مخصص</TabsTrigger>
                  </TabsList>
                </Tabs>

                {timePeriod === "custom" && (
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>من تاريخ</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="ml-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label>إلى تاريخ</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="ml-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            disabled={(date) => dateRange.from ? date < dateRange.from : false}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات الإحالة */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4 text-primary" />
                    إجمالي الدعوات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {referralStats.total}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    جميع الأصدقاء المدعوين
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gift className="h-4 w-4 text-primary" />
                    النقاط المكتسبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {referralStats.points}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    من دعوات الأصدقاء
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-primary" />
                    هذا الشهر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {referralStats.thisMonth}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {referralStats.lastMonth > 0 && (
                      <span className={referralStats.thisMonth >= referralStats.lastMonth ? "text-green-600" : "text-red-600"}>
                        {referralStats.thisMonth >= referralStats.lastMonth ? "+" : ""}
                        {referralStats.thisMonth - referralStats.lastMonth} عن الشهر الماضي
                      </span>
                    )}
                    {referralStats.lastMonth === 0 && "دعوات جديدة"}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    أفضل شهر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {referralStats.bestMonth.count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {referralStats.bestMonth.month || "لا توجد بيانات"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* الرسوم البيانية */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    الدعوات خلال {timePeriod === "3months" ? "آخر 3 أشهر" : timePeriod === "1year" ? "آخر سنة" : timePeriod === "custom" ? "النطاق المخصص" : "آخر 6 أشهر"}
                  </CardTitle>
                  <CardDescription>رسم بياني خطي يوضح تطور الدعوات</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="عدد الدعوات"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    توزيع الدعوات {timePeriod === "3months" ? "- آخر 3 أشهر" : timePeriod === "1year" ? "- آخر سنة" : timePeriod === "custom" ? "- النطاق المخصص" : "الشهرية"}
                  </CardTitle>
                  <CardDescription>رسم بياني بالأعمدة لتوزيع الدعوات</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                        name="عدد الدعوات"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* كود الإحالة */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>كود الإحالة الخاص بك</CardTitle>
                <CardDescription>
                  شارك هذا الكود مع أصدقائك للحصول على النقاط
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>الكود</Label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="font-mono text-lg font-bold text-center bg-muted"
                      dir="ltr"
                    />
                    <Button onClick={copyReferralCode} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رابط الدعوة</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getReferralUrl()}
                      readOnly
                      className="text-sm bg-muted"
                      dir="ltr"
                    />
                    <Button onClick={copyReferralUrl} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={shareReferral} 
                    className="w-full"
                    size="lg"
                  >
                    <Share2 className="h-5 w-5 ml-2" />
                    مشاركة رابط الدعوة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* قائمة الأصدقاء المدعوين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  الأصدقاء المدعوين ({referredUsers.length})
                </CardTitle>
                <CardDescription>
                  قائمة بجميع الأصدقاء الذين انضموا باستخدام كودك
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referredUsers.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">تاريخ الانضمام</TableHead>
                          <TableHead className="text-right">النقاط المكتسبة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referredUsers.map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(user.created_at), "d MMMM yyyy", { locale: ar })}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-primary font-semibold">
                                <Gift className="h-4 w-4" />
                                10 نقاط
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لم تقم بدعوة أي أصدقاء بعد</p>
                    <p className="text-sm mt-1">شارك كودك الآن واحصل على النقاط!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* كيف يعمل */}
            <Card>
              <CardHeader>
                <CardTitle>كيف يعمل نظام الدعوة؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">شارك الكود أو الرابط</p>
                      <p className="text-sm text-muted-foreground">
                        أرسل كود الإحالة أو الرابط لأصدقائك عبر وسائل التواصل الاجتماعي أو الرسائل
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">يسجل صديقك حساباً جديداً</p>
                      <p className="text-sm text-muted-foreground">
                        عند التسجيل، يقوم صديقك بإدخال كودك في خانة كود الإحالة الاختيارية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">احصل على 10 نقاط فوراً</p>
                      <p className="text-sm text-muted-foreground">
                        بمجرد اكتمال التسجيل، تحصل تلقائياً على 10 نقاط
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardReferral;