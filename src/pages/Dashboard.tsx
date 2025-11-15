import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ListingsTable } from "@/components/dashboard/ListingsTable";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

interface Profile {
  full_name: string;
  phone: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadUserData(user);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadUserData(user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (user: User) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData);
    }

    await fetchListings(user.id);
    setIsLoading(false);
  };

  const fetchListings = async (userId: string) => {
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
      return;
    }

    setListings(data || []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
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
                <h1 className="text-2xl font-bold">مرحباً، {profile?.full_name || "المستخدم"}</h1>
                <p className="text-sm text-muted-foreground">إدارة إعلاناتك ومتابعة نشاطك</p>
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
            {/* الإحصائيات والرسوم البيانية */}
            <DashboardStats listings={listings} />

            {/* جدول الإعلانات */}
            <Card className="p-6">
              <Tabs defaultValue="active" dir="rtl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">إعلاناتي</h2>
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

export default Dashboard;
