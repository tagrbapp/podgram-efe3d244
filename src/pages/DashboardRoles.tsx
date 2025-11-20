import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, UserCog, Search, Loader2, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

const DashboardRoles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate("/dashboard");
      return;
    }

    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all users from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedUsers: User[] = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        const roles = userRoles?.filter(r => r.user_id === authUser.id).map(r => r.role) || [];
        
        return {
          id: authUser.id,
          email: authUser.email || "",
          full_name: profile?.full_name || "مستخدم",
          avatar_url: profile?.avatar_url || null,
          created_at: profile?.created_at || authUser.created_at,
          roles: roles
        };
      });

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("فشل تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: "admin" | "moderator") => {
    setActionLoading(`add-${userId}-${role}`);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast.success(`تمت إضافة دور ${role === "admin" ? "المشرف" : "المراقب"} بنجاح`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast.error("فشل إضافة الدور");
    } finally {
      setActionLoading(null);
    }
  };

  const removeRole = async (userId: string, role: "admin" | "moderator") => {
    setActionLoading(`remove-${userId}-${role}`);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast.success(`تم إزالة دور ${role === "admin" ? "المشرف" : "المراقب"} بنجاح`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast.error("فشل إزالة الدور");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" ? true :
                       roleFilter === "admin" ? user.roles.includes("admin") :
                       roleFilter === "moderator" ? user.roles.includes("moderator") :
                       roleFilter === "user" ? user.roles.length === 0 : true;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <UserCog className="h-8 w-8 text-primary" />
                  إدارة الأدوار والصلاحيات
                </h1>
                <p className="text-muted-foreground mt-2">
                  إدارة أدوار المستخدمين وصلاحيات الوصول
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المشرفين</CardTitle>
                  <Shield className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {users.filter(u => u.roles.includes("admin")).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المراقبين</CardTitle>
                  <Shield className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {users.filter(u => u.roles.includes("moderator")).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مستخدمين عاديين</CardTitle>
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.roles.length === 0).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>بحث وفلترة</CardTitle>
                <CardDescription>ابحث عن المستخدمين وقم بفلترتهم حسب الأدوار</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث بالاسم أو البريد الإلكتروني..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="فلتر حسب الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="admin">مشرفين فقط</SelectItem>
                      <SelectItem value="moderator">مراقبين فقط</SelectItem>
                      <SelectItem value="user">مستخدمين عاديين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>المستخدمين ({filteredUsers.length})</CardTitle>
                <CardDescription>قائمة بجميع المستخدمين وأدوارهم</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الأدوار الحالية</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline">مستخدم عادي</Badge>
                            ) : (
                              user.roles.map(role => (
                                <Badge 
                                  key={role} 
                                  variant={role === "admin" ? "destructive" : "default"}
                                  className="gap-2"
                                >
                                  {role === "admin" ? "مشرف" : "مراقب"}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-4 w-4 p-0 hover:bg-background/20"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>تأكيد إزالة الدور</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          هل أنت متأكد من إزالة دور {role === "admin" ? "المشرف" : "المراقب"} من {user.full_name}؟
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => removeRole(user.id, role as "admin" | "moderator")}
                                          disabled={actionLoading === `remove-${user.id}-${role}`}
                                        >
                                          {actionLoading === `remove-${user.id}-${role}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            "تأكيد"
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-start">
                            {!user.roles.includes("admin") && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => addRole(user.id, "admin")}
                                disabled={actionLoading === `add-${user.id}-admin`}
                              >
                                {actionLoading === `add-${user.id}-admin` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 ml-2" />
                                    مشرف
                                  </>
                                )}
                              </Button>
                            )}
                            {!user.roles.includes("moderator") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addRole(user.id, "moderator")}
                                disabled={actionLoading === `add-${user.id}-moderator`}
                              >
                                {actionLoading === `add-${user.id}-moderator` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 ml-2" />
                                    مراقب
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardRoles;
