import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserX, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import AdminStats from "@/components/admin/AdminStats";
import ActionLogTimeline from "@/components/admin/ActionLogTimeline";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingReports: 0,
    blockedUsers: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadAdminData(user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadAdminData = async (userId: string) => {
    setLoading(true);
    try {
      // Load stats
      const [
        { count: usersCount },
        { count: listingsCount },
        { count: reportsCount },
        { count: blockedCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blocked_users").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalListings: listingsCount || 0,
        pendingReports: reportsCount || 0,
        blockedUsers: blockedCount || 0,
      });

      // Load users overview
      const { data: usersData, error: usersError } = await supabase.rpc("get_admin_users_overview");
      if (usersError) {
        console.error("Error loading users:", usersError);
      } else {
        setUsers(usersData || []);
      }

      // Load listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (listingsError) {
        console.error("Error loading listings:", listingsError);
      } else {
        setListings(listingsData || []);
      }

      // Load admin actions
      const { data: actionsData, error: actionsError } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (actionsError) {
        console.error("Error loading actions:", actionsError);
      } else {
        setActions(actionsData || []);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    const { user } = await getSession();
    if (!user) return;

    const reason = prompt("أدخل سبب الحظر:");
    if (!reason) return;

    try {
      const { error } = await supabase.rpc("admin_block_user", {
        _admin_id: user.id,
        _user_id: userId,
        _reason: reason,
        _duration_days: null,
      });

      if (error) throw error;

      toast.success("تم حظر المستخدم بنجاح");
      loadAdminData(user.id);
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("فشل حظر المستخدم");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const { user } = await getSession();
    if (!user) return;

    try {
      const { error } = await supabase.rpc("admin_unblock_user", {
        _admin_id: user.id,
        _user_id: userId,
      });

      if (error) throw error;

      toast.success("تم إلغاء حظر المستخدم بنجاح");
      loadAdminData(user.id);
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("فشل إلغاء الحظر");
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const { user } = await getSession();
    if (!user) return;

    const reason = prompt("أدخل سبب حذف الإعلان:");
    if (!reason) return;

    try {
      const { error } = await supabase.rpc("admin_delete_listing", {
        _admin_id: user.id,
        _listing_id: listingId,
        _reason: reason,
      });

      if (error) throw error;

      toast.success("تم حذف الإعلان بنجاح");
      loadAdminData(user.id);
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("فشل حذف الإعلان");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
  );

  const filteredListings = listings.filter(
    (listing) =>
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 shadow-sm">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">جاري التحميل...</h1>
            </header>
            <main className="p-6">
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </main>
          </div>
          <AppSidebar />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">لوحة الإدارة</h1>
          </header>
          <main className="p-6 space-y-6">
      <AdminStats {...stats} />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="listings">الإعلانات</TabsTrigger>
          <TabsTrigger value="actions">سجل الإجراءات</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الإعلانات</TableHead>
                  <TableHead>المبيعات</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.total_listings}</TableCell>
                    <TableCell>{user.total_sales}</TableCell>
                    <TableCell>{user.avg_rating.toFixed(1)} ⭐</TableCell>
                    <TableCell>
                      <Badge variant="outline">المستوى {user.level}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_blocked ? (
                        <Badge variant="destructive">محظور</Badge>
                      ) : (
                        <Badge variant="default">نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            الإجراءات
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض الملف
                          </DropdownMenuItem>
                          {user.is_blocked ? (
                            <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                              إلغاء الحظر
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                              <UserX className="ml-2 h-4 w-4" />
                              حظر
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>البائع</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.profiles?.full_name}</TableCell>
                    <TableCell>{listing.price} ج.م</TableCell>
                    <TableCell>
                      <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                        {listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(listing.created_at), "PP")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            الإجراءات
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteListing(listing.id)}>
                            حذف الإعلان
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <ActionLogTimeline actions={actions} />
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

export default DashboardAdmin;
