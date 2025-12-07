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
import { Plus, Gavel, Package } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Edit } from "lucide-react";

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

interface Auction {
  id: string;
  title: string;
  starting_price: number;
  current_bid: number | null;
  status: string;
  end_time: string;
  created_at: string;
  images: string[] | null;
  categories: {
    name: string;
  } | null;
  bid_count: number;
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
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"listings" | "auctions">("listings");

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

    await Promise.all([
      fetchListings(user.id),
      fetchAuctions(user.id)
    ]);
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

  const fetchAuctions = async (userId: string) => {
    const { data, error } = await supabase
      .from("auctions")
      .select(`
        id,
        title,
        starting_price,
        current_bid,
        status,
        end_time,
        created_at,
        images,
        categories (
          name
        )
      `)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب المزادات");
      return;
    }

    // Fetch bid counts
    const auctionsWithCounts = await Promise.all(
      (data || []).map(async (auction) => {
        const { count } = await supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("auction_id", auction.id);
        
        return {
          ...auction,
          bid_count: count || 0,
        };
      })
    );

    setAuctions(auctionsWithCounts);
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

  const handleAuctionDelete = async (id: string) => {
    const { error } = await supabase
      .from("auctions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("خطأ في حذف المزاد");
      return;
    }

    toast.success("تم حذف المزاد بنجاح");
    if (user) {
      fetchAuctions(user.id);
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

  const activeAuctions = auctions.filter(a => a.status === "active");
  const endedAuctions = auctions.filter(a => a.status === "ended");

  const getAuctionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">نشط</Badge>;
      case "ended":
        return <Badge className="bg-muted text-muted-foreground">منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                <p className="text-sm text-muted-foreground">إدارة إعلاناتك ومزاداتك</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link to="/add-listing">
                <Button variant="outline" className="gap-2">
                  <Package className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </Link>
              <Link to="/dashboard/auctions">
                <Button className="gap-2 bg-gradient-secondary hover:opacity-90 transition-smooth shadow-elegant">
                  <Gavel className="h-4 w-4" />
                  إضافة مزاد
                </Button>
              </Link>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {/* الإحصائيات */}
            <DashboardStats listings={listings} />

            {/* التبويب الرئيسي */}
            <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as "listings" | "auctions")} dir="rtl">
              <TabsList className="mb-6">
                <TabsTrigger value="listings" className="gap-2">
                  <Package className="h-4 w-4" />
                  الإعلانات ({listings.length})
                </TabsTrigger>
                <TabsTrigger value="auctions" className="gap-2">
                  <Gavel className="h-4 w-4" />
                  المزادات ({auctions.length})
                </TabsTrigger>
              </TabsList>

              {/* قسم الإعلانات */}
              <TabsContent value="listings">
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
              </TabsContent>

              {/* قسم المزادات */}
              <TabsContent value="auctions">
                <Card className="p-6">
                  <Tabs defaultValue="active" dir="rtl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">مزاداتي</h2>
                      <TabsList>
                        <TabsTrigger value="active">النشطة ({activeAuctions.length})</TabsTrigger>
                        <TabsTrigger value="ended">المنتهية ({endedAuctions.length})</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="active">
                      <AuctionsTable 
                        auctions={activeAuctions}
                        onDelete={handleAuctionDelete}
                        getStatusBadge={getAuctionStatusBadge}
                      />
                    </TabsContent>

                    <TabsContent value="ended">
                      <AuctionsTable 
                        auctions={endedAuctions}
                        onDelete={handleAuctionDelete}
                        getStatusBadge={getAuctionStatusBadge}
                      />
                    </TabsContent>
                  </Tabs>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

// Component for auctions table
const AuctionsTable = ({ 
  auctions, 
  onDelete, 
  getStatusBadge 
}: { 
  auctions: Auction[]; 
  onDelete: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const navigate = useNavigate();

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">لا توجد مزادات</p>
      </div>
    );
  }

  return (
    <Table dir="rtl">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">المزاد</TableHead>
          <TableHead className="text-right">السعر الابتدائي</TableHead>
          <TableHead className="text-right">العرض الحالي</TableHead>
          <TableHead className="text-right">عدد المزايدات</TableHead>
          <TableHead className="text-right">الحالة</TableHead>
          <TableHead className="text-right">تاريخ الانتهاء</TableHead>
          <TableHead className="text-right">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auctions.map((auction) => (
          <TableRow key={auction.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <img
                  src={auction.images?.[0] || "/placeholder.svg"}
                  alt={auction.title || "مزاد"}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium line-clamp-1">{auction.title || "مزاد"}</p>
                  <p className="text-xs text-muted-foreground">{auction.categories?.name || "غير محدد"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{auction.starting_price.toLocaleString("en-US")} ر.س</TableCell>
            <TableCell className="font-semibold text-primary">
              {(auction.current_bid || auction.starting_price).toLocaleString("en-US")} ر.س
            </TableCell>
            <TableCell>{auction.bid_count}</TableCell>
            <TableCell>{getStatusBadge(auction.status)}</TableCell>
            <TableCell>
              {new Date(auction.end_time).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => navigate(`/auction/${auction.id}`)}>
                    <Eye className="h-4 w-4 ml-2" />
                    عرض
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(auction.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Dashboard;
