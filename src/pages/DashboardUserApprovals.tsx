import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserX, Clock, CheckCircle2, XCircle, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

interface PendingUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  approval_status: string;
  approved_at: string | null;
  email?: string;
}

const DashboardUserApprovals = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setCurrentUser(user);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    if (!roleData || roleData.length === 0) {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, created_at, approval_status, approved_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch emails from auth.users
      const usersWithEmails = await Promise.all(
        (data || []).map(async (user) => {
          const { data: authData } = await supabase.auth.admin.getUserById(user.id);
          return {
            ...user,
            email: authData.user?.email || ""
          };
        })
      );

      setPendingUsers(usersWithEmails.filter(u => u.approval_status === "pending"));
      setApprovedUsers(usersWithEmails.filter(u => u.approval_status === "approved"));
      setRejectedUsers(usersWithEmails.filter(u => u.approval_status === "rejected"));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل تحميل بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    try {
      const { data, error } = await supabase.rpc("approve_user", {
        _admin_id: currentUser.id,
        _user_id: userId,
        _approve: approve
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        toast.success(approve ? "تمت الموافقة على العضو" : "تم رفض العضو");
        fetchUsers();
      } else {
        toast.error(result.error || "فشلت العملية");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("حدث خطأ أثناء معالجة الطلب");
    }
  };

  const UserCard = ({ user, showActions = false }: { user: PendingUser; showActions?: boolean }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback className="text-lg">{user.full_name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-bold">{user.full_name}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {user.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              تاريخ التسجيل: {format(new Date(user.created_at), "PPp")}
            </span>
          </div>

          {user.approved_at && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                تاريخ الموافقة: {format(new Date(user.approved_at), "PPp")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={
              user.approval_status === "approved" ? "default" :
              user.approval_status === "rejected" ? "destructive" : "secondary"
            }>
              {user.approval_status === "approved" ? "معتمد" :
               user.approval_status === "rejected" ? "مرفوض" : "قيد المراجعة"}
            </Badge>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleApproveUser(user.id, true)}
                className="gap-2"
                size="sm"
              >
                <UserCheck className="h-4 w-4" />
                الموافقة
              </Button>
              <Button
                onClick={() => handleApproveUser(user.id, false)}
                variant="destructive"
                className="gap-2"
                size="sm"
              >
                <UserX className="h-4 w-4" />
                الرفض
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">إدارة موافقات الأعضاء</h1>
          <p className="text-muted-foreground">
            مراجعة والموافقة على طلبات الانضمام للمنصة
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              قيد المراجعة ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              المعتمدون ({approvedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              المرفوضون ({rejectedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  لا توجد طلبات قيد المراجعة
                </p>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <UserCard key={user.id} user={user} showActions={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  لا توجد حسابات معتمدة
                </p>
              </Card>
            ) : (
              approvedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  لا توجد حسابات مرفوضة
                </p>
              </Card>
            ) : (
              rejectedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardUserApprovals;
