import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCheck, UserX, Clock, CheckCircle2, XCircle, Mail, Phone, Calendar, Building2, FileText, Briefcase, History, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface PendingUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  approval_status: string;
  approved_at: string | null;
  membership_type: string;
  business_name: string | null;
  commercial_registration: string | null;
  business_type: string | null;
  business_description: string | null;
  id_document_url: string | null;
  rejection_reason: string | null;
  email?: string;
}

interface MembershipHistory {
  id: string;
  from_type: string;
  to_type: string;
  from_status: string;
  to_status: string;
  business_name: string | null;
  commercial_registration: string | null;
  business_type: string | null;
  created_at: string;
}

const DashboardUserApprovals = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistory[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");

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
        .select(`
          id, full_name, avatar_url, phone, created_at, 
          approval_status, approved_at, membership_type,
          business_name, commercial_registration, business_type,
          business_description, id_document_url, rejection_reason
        `)
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

  const fetchMembershipHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("membership_change_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembershipHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("فشل تحميل سجل التغييرات");
    }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    try {
      // If rejecting, update rejection reason first
      if (!approve) {
        await supabase
          .from("profiles")
          .update({ rejection_reason: rejectionReason })
          .eq("id", userId);
      }

      const { data, error } = await supabase.rpc("approve_user", {
        _admin_id: currentUser.id,
        _user_id: userId,
        _approve: approve
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        toast.success(approve ? "تمت الموافقة على العضو" : "تم رفض العضو");
        setRejectionReason("");
        setShowDetailsDialog(false);
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
            <Badge variant={user.membership_type === "merchant" ? "default" : "secondary"} className="mt-1">
              {user.membership_type === "merchant" ? "تاجر" : "مستهلك"}
            </Badge>
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

          {/* Merchant Details */}
          {user.membership_type === "merchant" && (user.business_name || user.commercial_registration) && (
            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-sm">
              {user.business_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{user.business_name}</span>
                </div>
              )}
              {user.commercial_registration && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">س.ت: {user.commercial_registration}</span>
                </div>
              )}
              {user.business_type && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {user.business_type === "jewelry" ? "مجوهرات وذهب" :
                     user.business_type === "watches" ? "ساعات فاخرة" :
                     user.business_type === "bags" ? "حقائب وإكسسوارات" :
                     user.business_type === "fashion" ? "أزياء راقية" :
                     user.business_type === "antiques" ? "تحف ومقتنيات" :
                     user.business_type === "electronics" ? "إلكترونيات فاخرة" : "أخرى"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              تاريخ التسجيل: {format(new Date(user.created_at), "PPp", { locale: ar })}
            </span>
          </div>

          {user.approved_at && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                تاريخ الموافقة: {format(new Date(user.approved_at), "PPp", { locale: ar })}
              </span>
            </div>
          )}

          {user.rejection_reason && (
            <div className="bg-destructive/10 p-3 rounded-lg text-sm">
              <p className="font-medium text-destructive mb-1">سبب الرفض:</p>
              <p className="text-muted-foreground">{user.rejection_reason}</p>
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

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button
              onClick={() => {
                setSelectedUser(user);
                setShowDetailsDialog(true);
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              عرض التفاصيل
            </Button>
            <Button
              onClick={() => {
                fetchMembershipHistory(user.id);
                setSelectedUser(user);
                setShowHistoryDialog(true);
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              السجل
            </Button>
            {showActions && (
              <>
                <Button
                  onClick={() => handleApproveUser(user.id, true)}
                  className="gap-2"
                  size="sm"
                >
                  <UserCheck className="h-4 w-4" />
                  الموافقة
                </Button>
                <Button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDetailsDialog(true);
                  }}
                  variant="destructive"
                  className="gap-2"
                  size="sm"
                >
                  <UserX className="h-4 w-4" />
                  الرفض
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <div className="flex items-center justify-center h-screen">
              <p className="text-center">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة موافقات الأعضاء</h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
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
          </main>
        </div>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب</DialogTitle>
              <DialogDescription>
                معلومات كاملة عن العضو والطلب
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="text-xl">{selectedUser.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                {selectedUser.membership_type === "merchant" && (
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      معلومات المنشأة
                    </h4>
                    {selectedUser.business_name && (
                      <div>
                        <Label>اسم المنشأة</Label>
                        <p className="text-foreground font-medium">{selectedUser.business_name}</p>
                      </div>
                    )}
                    {selectedUser.commercial_registration && (
                      <div>
                        <Label>رقم السجل التجاري</Label>
                        <p className="text-foreground font-medium">{selectedUser.commercial_registration}</p>
                      </div>
                    )}
                    {selectedUser.business_type && (
                      <div>
                        <Label>نوع النشاط</Label>
                        <p className="text-foreground font-medium">
                          {selectedUser.business_type === "jewelry" ? "مجوهرات وذهب" :
                           selectedUser.business_type === "watches" ? "ساعات فاخرة" :
                           selectedUser.business_type === "bags" ? "حقائب وإكسسوارات" :
                           selectedUser.business_type === "fashion" ? "أزياء راقية" :
                           selectedUser.business_type === "antiques" ? "تحف ومقتنيات" :
                           selectedUser.business_type === "electronics" ? "إلكترونيات فاخرة" : "أخرى"}
                        </p>
                      </div>
                    )}
                    {selectedUser.business_description && (
                      <div>
                        <Label>وصف النشاط</Label>
                        <p className="text-muted-foreground">{selectedUser.business_description}</p>
                      </div>
                    )}
                    {selectedUser.id_document_url && (
                      <div>
                        <Label>الوثائق المرفقة</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 gap-2"
                          onClick={() => window.open(selectedUser.id_document_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          عرض المستند
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedUser.approval_status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="rejectionReason">سبب الرفض (في حالة الرفض)</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="اكتب سبب الرفض إذا كنت ترغب في رفض الطلب..."
                        className="text-right"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveUser(selectedUser.id, true)}
                        className="flex-1 gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        الموافقة على الطلب
                      </Button>
                      <Button
                        onClick={() => handleApproveUser(selectedUser.id, false)}
                        variant="destructive"
                        className="flex-1 gap-2"
                        disabled={!rejectionReason.trim()}
                      >
                        <UserX className="h-4 w-4" />
                        رفض الطلب
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-3xl text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل التغييرات
              </DialogTitle>
              <DialogDescription>
                سجل تغييرات نوع العضوية وحالة الاعتماد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {membershipHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا يوجد سجل تغييرات
                </p>
              ) : (
                membershipHistory.map((record) => (
                  <Card key={record.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge>{record.from_type === "merchant" ? "تاجر" : "مستهلك"}</Badge>
                          <span>→</span>
                          <Badge>{record.to_type === "merchant" ? "تاجر" : "مستهلك"}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(record.created_at), "PPp", { locale: ar })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={record.to_status === "approved" ? "default" : "secondary"}>
                          {record.to_status === "approved" ? "معتمد" :
                           record.to_status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </Badge>
                      </div>
                      {(record.business_name || record.commercial_registration) && (
                        <div className="bg-muted/30 p-3 rounded text-sm space-y-1">
                          {record.business_name && (
                            <p><span className="font-medium">المنشأة:</span> {record.business_name}</p>
                          )}
                          {record.commercial_registration && (
                            <p><span className="font-medium">السجل:</span> {record.commercial_registration}</p>
                          )}
                          {record.business_type && (
                            <p><span className="font-medium">النشاط:</span> {
                              record.business_type === "jewelry" ? "مجوهرات وذهب" :
                              record.business_type === "watches" ? "ساعات فاخرة" :
                              record.business_type === "bags" ? "حقائب وإكسسوارات" :
                              record.business_type === "fashion" ? "أزياء راقية" :
                              record.business_type === "antiques" ? "تحف ومقتنيات" :
                              record.business_type === "electronics" ? "إلكترونيات فاخرة" : "أخرى"
                            }</p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default DashboardUserApprovals;
