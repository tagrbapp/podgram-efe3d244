import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingsTable } from "@/components/dashboard/ListingsTable";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, Package, Eye, TrendingUp } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";

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

const DashboardListings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        fetchListings(user.id);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        fetchListings(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchListings = async (userId: string) => {
    setIsLoading(true);
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الإعلانات");
      setIsLoading(false);
      return;
    }

    setListings(data || []);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("خطأ في حذف الإعلان");
      return;
    }

    toast.success("تم حذف الإعلان بنجاح");
    if (user) {
      fetchListings(user.id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("خطأ في تحديث حالة الإعلان");
      return;
    }

    toast.success("تم تحديث حالة الإعلان");
    if (user) {
      fetchListings(user.id);
    }
  };

  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");
  const inactiveListings = listings.filter(l => l.status === "inactive");
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

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
                <h1 className="text-2xl font-bold">إعلاناتي</h1>
                <p className="text-sm text-muted-foreground">إدارة جميع إعلاناتك</p>
              </div>
            </div>
            
            <Link to="/add-listing">
              <Button className="gap-2 bg-gradient-secondary hover:opacity-90 transition-smooth shadow-elegant">
                <Plus className="h-4 w-4" />
                إضافة إعلان جديد
              </Button>
            </Link>
          </header>

          <main className="p-6 space-y-6">
            {/* إحصائيات سريعة */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإعلانات</p>
                    <p className="text-2xl font-bold">{listings.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات النشطة</p>
                    <p className="text-2xl font-bold">{activeListings.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                    <p className="text-2xl font-bold">{totalViews}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات المباعة</p>
                    <p className="text-2xl font-bold">{soldListings.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* جدول الإعلانات */}
            <Card className="p-6">
              <Tabs defaultValue="active" dir="rtl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">جميع الإعلانات</h2>
                  <TabsList>
                    <TabsTrigger value="active">النشطة ({activeListings.length})</TabsTrigger>
                    <TabsTrigger value="sold">المباعة ({soldListings.length})</TabsTrigger>
                    <TabsTrigger value="inactive">غير نشطة ({inactiveListings.length})</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="active">
                  <ListingsTable 
                    listings={activeListings} 
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </TabsContent>

                <TabsContent value="sold">
                  <ListingsTable 
                    listings={soldListings} 
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </TabsContent>

                <TabsContent value="inactive">
                  <ListingsTable 
                    listings={inactiveListings} 
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </TabsContent>
              </Tabs>
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

export default DashboardListings;
