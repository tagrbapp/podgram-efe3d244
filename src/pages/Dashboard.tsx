import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);
    
    // جلب الملف الشخصي
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // جلب الإعلانات
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
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* رأس الصفحة */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">مرحباً، {profile?.full_name || "المستخدم"}</h1>
              <p className="text-muted-foreground">إدارة إعلاناتك ومتابعة نشاطك</p>
            </div>
            <Link to="/add-listing">
              <Button className="gap-2 bg-gradient-secondary hover:opacity-90 transition-smooth shadow-elegant">
                <Plus className="h-4 w-4" />
                إضافة إعلان جديد
              </Button>
            </Link>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">إجمالي الإعلانات</p>
              <p className="text-2xl font-bold">{listings.length}</p>
            </Card>
            <Card className="p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">النشطة</p>
              <p className="text-2xl font-bold text-green-600">{activeListings.length}</p>
            </Card>
            <Card className="p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">المباعة</p>
              <p className="text-2xl font-bold text-blue-600">{soldListings.length}</p>
            </Card>
            <Card className="p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">المشاهدات</p>
              <p className="text-2xl font-bold">
                {listings.reduce((sum, l) => sum + l.views, 0)}
              </p>
            </Card>
          </div>
        </div>

        {/* جدول الإعلانات */}
        <Card className="p-6 shadow-elegant">
          <Tabs defaultValue="active" dir="rtl">
            <TabsList className="mb-6">
              <TabsTrigger value="active">النشطة ({activeListings.length})</TabsTrigger>
              <TabsTrigger value="sold">المباعة ({soldListings.length})</TabsTrigger>
              <TabsTrigger value="inactive">غير نشطة ({inactiveListings.length})</TabsTrigger>
            </TabsList>

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
      </div>
    </div>
  );
};

const ListingsTable = ({ 
  listings, 
  onDelete, 
  onStatusChange 
}: { 
  listings: Listing[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد إعلانات في هذا القسم</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="p-4 hover:shadow-card transition-smooth">
          <div className="flex gap-4">
            {/* صورة الإعلان */}
            <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden shrink-0">
              {listing.images && listing.images.length > 0 ? (
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* معلومات الإعلان */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{listing.location}</span>
                    <span>•</span>
                    <span>{listing.categories?.name || "غير محدد"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {listing.views} مشاهدة
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={listing.status === "active" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {listing.status === "active" ? "نشط" : listing.status === "sold" ? "مباع" : "غير نشط"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {listing.price} ريال
                </p>
                
                <div className="flex items-center gap-2">
                  {listing.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(listing.id, "sold")}
                    >
                      تم البيع
                    </Button>
                  )}
                  {listing.status === "sold" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(listing.id, "active")}
                    >
                      إعادة نشر
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(listing.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;
