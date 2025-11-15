import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getSession } from "@/lib/auth";
import { getRevenueData, getViewsData, getSalesData, RevenueData, ViewsData } from "@/lib/analytics";
import { TrendingUp, DollarSign, Eye, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardAdvancedAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [viewsData, setViewsData] = useState<ViewsData[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadAnalytics(user.id);
    };
    checkAuth();
  }, [navigate, period]);

  const loadAnalytics = async (userId: string) => {
    setLoading(true);
    try {
      const days = parseInt(period);
      const [revenue, views, sales] = await Promise.all([
        getRevenueData(userId, days),
        getViewsData(userId, days),
        getSalesData(userId),
      ]);

      setRevenueData(revenue);
      setViewsData(views);
      setSalesData(sales);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalViews = viewsData.reduce((sum, item) => sum + item.views, 0);
  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger />
            <div className="flex-1 flex justify-between items-center">
              <h1 className="text-xl font-semibold">التحليلات المتقدمة</h1>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                <TabsList>
                  <TabsTrigger value="7">آخر 7 أيام</TabsTrigger>
                  <TabsTrigger value="30">آخر 30 يوم</TabsTrigger>
                  <TabsTrigger value="90">آخر 90 يوم</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>
          <main className="p-6 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} ج.م</div>
                <p className="text-xs text-muted-foreground">خلال آخر {period} يوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">خلال آخر {period} يوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
                <p className="text-xs text-muted-foreground">جميع الأوقات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">متوسط البيع</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageSale.toFixed(2)} ج.م</div>
                <p className="text-xs text-muted-foreground">لكل عملية بيع</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات عبر الوقت</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="الإيرادات" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المشاهدات عبر الوقت</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" name="المشاهدات" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {salesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المبيعات حسب التاريخ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="hsl(var(--chart-3))" name="المبيعات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
              </>
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

export default DashboardAdvancedAnalytics;
