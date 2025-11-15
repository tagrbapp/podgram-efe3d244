import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListingCard from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";
import { User, Phone, Calendar, MapPin, MessageSquare, Package, TrendingUp, Eye, Star, ArrowRight } from "lucide-react";

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

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    }
  }, [id]);

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
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("فشل في جلب الإعلانات");
      setIsLoading(false);
      return;
    }

    setListings(data || []);
    setIsLoading(false);
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

                <h1 className="text-2xl font-bold mb-2">{profile.full_name}</h1>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">عضو منذ {getMemberSince(profile.created_at)}</span>
                </div>

                {!isOwnProfile && (
                  <Button 
                    onClick={handleStartChat}
                    className="w-full mt-4 bg-gradient-primary hover:opacity-90 shadow-lg"
                    size="lg"
                  >
                    <MessageSquare className="ml-2 h-5 w-5" />
                    راسل البائع
                  </Button>
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
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="active">
                        النشطة ({activeListings.length})
                      </TabsTrigger>
                      <TabsTrigger value="all">
                        الكل ({listings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      <div className="grid md:grid-cols-2 gap-6">
                        {activeListings.map((listing) => (
                          <ListingCard 
                            key={listing.id} 
                            id={listing.id}
                            title={listing.title}
                            price={`${listing.price.toLocaleString('ar-SA')} ر.س`}
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
                            price={`${listing.price.toLocaleString('ar-SA')} ر.س`}
                            location={listing.location}
                            time={new Date(listing.created_at).toLocaleDateString('ar-SA')}
                            image={listing.images?.[0] || "/placeholder.svg"}
                            category={listing.categories?.name || "غير محدد"}
                          />
                        ))}
                      </div>
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
