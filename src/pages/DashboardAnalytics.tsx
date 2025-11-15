import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { TrendingUp, Eye, Heart, Package, Calendar, MapPin } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  views: number;
  created_at: string;
  categories: {
    name: string;
  } | null;
}

interface Favorite {
  listing_id: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

const DashboardAnalytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadAnalytics(user.id);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadAnalytics(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAnalytics = async (userId: string) => {
    setIsLoading(true);
    
    // جلب الإعلانات
    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        status,
        views,
        created_at,
        categories (
          name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (listingsError) {
      toast.error("خطأ في جلب البيانات");
      setIsLoading(false);
      return;
    }

    // جلب المفضلات
    const listingIds = listingsData?.map(l => l.id) || [];
    const { data: favoritesData } = await supabase
      .from("favorites")
      .select("listing_id")
      .in("listing_id", listingIds);

    setListings(listingsData || []);
    setFavorites(favoritesData || []);
    setIsLoading(false);
  };

  // إحصائيات حسب الحالة
  const statusData = [
    { name: "نشط", value: listings.filter(l => l.status === "active").length },
    { name: "مباع", value: listings.filter(l => l.status === "sold").length },
    { name: "غير نشط", value: listings.filter(l => l.status === "inactive").length },
  ].filter(item => item.value > 0);

  // إحصائيات حسب الفئة
  const categoryData = listings.reduce((acc, listing) => {
    const categoryName = listing.categories?.name || "أخرى";
    const existing = acc.find(item => item.name === categoryName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: categoryName, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // أفضل الإعلانات حسب المشاهدات
  const topViewedListings = [...listings]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map(l => ({ name: l.title.substring(0, 20) + "...", views: l.views || 0 }));

  // إحصائيات حسب الموقع
  const locationData = listings.reduce((acc, listing) => {
    const existing = acc.find(item => item.name === listing.location);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: listing.location, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const avgViews = listings.length > 0 ? Math.round(totalViews / listings.length) : 0;

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
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">الإحصائيات والتحليلات</h1>
                <p className="text-sm text-muted-foreground">تحليل أداء إعلاناتك</p>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {/* إحصائيات عامة */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإعلانات</p>
                    <p className="text-3xl font-bold">{listings.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                    <p className="text-3xl font-bold">{totalViews}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط المشاهدات</p>
                    <p className="text-3xl font-bold">{avgViews}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/20">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المفضلة</p>
                    <p className="text-3xl font-bold">{favorites.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* الرسوم البيانية */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* توزيع حسب الحالة */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">توزيع الإعلانات حسب الحالة</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* توزيع حسب الفئة */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">توزيع الإعلانات حسب الفئة</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* أكثر الإعلانات مشاهدة */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  أكثر الإعلانات مشاهدة
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topViewedListings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* توزيع حسب الموقع */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  توزيع الإعلانات حسب الموقع
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* معلومات إضافية */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                ملخص النشاط
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">أحدث إعلان</p>
                  <p className="font-medium">
                    {listings[0] ? new Date(listings[0].created_at).toLocaleDateString('ar-SA') : "لا يوجد"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">عدد الإعلانات النشطة</p>
                  <p className="font-medium">{listings.filter(l => l.status === "active").length}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">معدل التحويل للبيع</p>
                  <p className="font-medium">
                    {listings.length > 0 
                      ? `${((listings.filter(l => l.status === "sold").length / listings.length) * 100).toFixed(1)}%`
                      : "0%"
                    }
                  </p>
                </div>
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

export default DashboardAnalytics;
