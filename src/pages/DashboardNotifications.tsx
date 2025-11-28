import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Edit, Trash2, Send, Users, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const DashboardNotifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Form states for sending notification
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "system",
    target: "all", // all, specific
    userId: "",
  });

  useEffect(() => {
    checkUser();
    fetchAllNotifications();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    setUser(session.user);
  };

  const fetchAllNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("فشل جلب الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الإشعار");
      fetchAllNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("فشل حذف الإشعار");
    }
  };

  const handleUpdate = async () => {
    if (!editingNotification) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          title: editingNotification.title,
          message: editingNotification.message,
          type: editingNotification.type,
        })
        .eq("id", editingNotification.id);

      if (error) throw error;

      toast.success("تم تحديث الإشعار");
      setIsDialogOpen(false);
      setEditingNotification(null);
      fetchAllNotifications();
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("فشل تحديث الإشعار");
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("يجب إدخال العنوان والرسالة");
      return;
    }

    try {
      if (newNotification.target === "all") {
        // Send to all users
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id");

        if (!profiles) throw new Error("لا يوجد مستخدمين");

        const notificationsToInsert = profiles.map((profile) => ({
          user_id: profile.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(notificationsToInsert);

        if (error) throw error;
        toast.success(`تم إرسال الإشعار لجميع المستخدمين (${profiles.length})`);
      } else {
        // Send to specific user
        if (!newNotification.userId) {
          toast.error("يجب إدخال معرف المستخدم");
          return;
        }

        const { error } = await supabase
          .from("notifications")
          .insert({
            user_id: newNotification.userId,
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.type,
          });

        if (error) throw error;
        toast.success("تم إرسال الإشعار");
      }

      setIsSendDialogOpen(false);
      setNewNotification({
        title: "",
        message: "",
        type: "system",
        target: "all",
        userId: "",
      });
      fetchAllNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("فشل إرسال الإشعار");
    }
  };

  // تطبيق الفلاتر
  const filteredNotifications = notifications.filter((notification) => {
    // البحث النصي
    const searchMatch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    // فلترة حسب النوع
    const typeMatch = filterType === "all" || notification.type === filterType;

    // فلترة حسب الحالة
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "read" && notification.is_read) ||
      (filterStatus === "unread" && !notification.is_read);

    // فلترة حسب التاريخ
    let dateMatch = true;
    const notificationDate = new Date(notification.created_at);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateMatch = dateMatch && notificationDate >= start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch = dateMatch && notificationDate <= end;
    }

    return searchMatch && typeMatch && statusMatch && dateMatch;
  });

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Navbar />
          <main className="container mx-auto px-4 py-8 mt-20" dir="rtl">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <CardTitle className="text-2xl">إدارة الإشعارات</CardTitle>
                    <Badge variant="secondary">{notifications.length} إشعار</Badge>
                  </div>
                  <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Send className="h-4 w-4 ml-2" />
                        إرسال إشعار جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إرسال إشعار جديد</DialogTitle>
                        <DialogDescription>
                          إرسال إشعار لجميع المستخدمين أو مستخدم محدد
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block text-right">العنوان</label>
                          <Input
                            value={newNotification.title}
                            onChange={(e) =>
                              setNewNotification({ ...newNotification, title: e.target.value })
                            }
                            placeholder="عنوان الإشعار"
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block text-right">الرسالة</label>
                          <Textarea
                            value={newNotification.message}
                            onChange={(e) =>
                              setNewNotification({ ...newNotification, message: e.target.value })
                            }
                            placeholder="نص الإشعار"
                            className="text-right"
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block text-right">النوع</label>
                          <Select
                            value={newNotification.type}
                            onValueChange={(value) =>
                              setNewNotification({ ...newNotification, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system">نظام</SelectItem>
                              <SelectItem value="message">رسالة</SelectItem>
                              <SelectItem value="sale">بيع</SelectItem>
                              <SelectItem value="bid">مزايدة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block text-right">الإرسال إلى</label>
                          <Select
                            value={newNotification.target}
                            onValueChange={(value) =>
                              setNewNotification({ ...newNotification, target: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع المستخدمين</SelectItem>
                              <SelectItem value="specific">مستخدم محدد</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newNotification.target === "specific" && (
                          <div>
                            <label className="text-sm font-medium mb-2 block text-right">
                              معرف المستخدم
                            </label>
                            <Input
                              value={newNotification.userId}
                              onChange={(e) =>
                                setNewNotification({ ...newNotification, userId: e.target.value })
                              }
                              placeholder="أدخل معرف المستخدم"
                              className="text-right"
                            />
                          </div>
                        )}
                        <Button onClick={handleSendNotification} className="w-full">
                          <Send className="h-4 w-4 ml-2" />
                          إرسال الإشعار
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* الفلاتر والبحث */}
                <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
                  {/* البحث النصي */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="ابحث في العنوان، الرسالة أو اسم المستخدم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-right"
                      />
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {(searchQuery || startDate || endDate || filterType !== "all" || filterStatus !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setStartDate("");
                          setEndDate("");
                          setFilterType("all");
                          setFilterStatus("all");
                        }}
                      >
                        مسح الفلاتر
                      </Button>
                    )}
                  </div>

                  {/* الفلاتر */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">النوع:</label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="system">نظام</SelectItem>
                          <SelectItem value="message">رسالة</SelectItem>
                          <SelectItem value="bid">مزايدة</SelectItem>
                          <SelectItem value="outbid">تجاوز المزايدة</SelectItem>
                          <SelectItem value="sale">بيع</SelectItem>
                          <SelectItem value="auction_start">بدء مزاد</SelectItem>
                          <SelectItem value="auction_end">انتهاء مزاد</SelectItem>
                          <SelectItem value="auction_won">فوز بالمزاد</SelectItem>
                          <SelectItem value="favorite">مفضلة</SelectItem>
                          <SelectItem value="review">تقييم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">الحالة:</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="read">مقروء</SelectItem>
                          <SelectItem value="unread">غير مقروء</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">من:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">إلى:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* عدد النتائج */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      عرض {filteredNotifications.length} من {notifications.length} إشعار
                    </span>
                    {filteredNotifications.length !== notifications.length && (
                      <Badge variant="secondary">
                        تمت التصفية
                      </Badge>
                    )}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الرسالة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد إشعارات تطابق معايير البحث
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="text-right">
                          {notification.profiles?.full_name || "غير معروف"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell className="text-right max-w-xs truncate">
                          {notification.message}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{notification.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {notification.is_read ? (
                            <Badge variant="secondary">مقروء</Badge>
                          ) : (
                            <Badge variant="default">غير مقروء</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Dialog open={isDialogOpen && editingNotification?.id === notification.id} onOpenChange={(open) => {
                              setIsDialogOpen(open);
                              if (!open) setEditingNotification(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingNotification(notification)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md" dir="rtl">
                                <DialogHeader>
                                  <DialogTitle>تعديل الإشعار</DialogTitle>
                                </DialogHeader>
                                {editingNotification && (
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <label className="text-sm font-medium mb-2 block text-right">
                                        العنوان
                                      </label>
                                      <Input
                                        value={editingNotification.title}
                                        onChange={(e) =>
                                          setEditingNotification({
                                            ...editingNotification,
                                            title: e.target.value,
                                          })
                                        }
                                        className="text-right"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium mb-2 block text-right">
                                        الرسالة
                                      </label>
                                      <Textarea
                                        value={editingNotification.message}
                                        onChange={(e) =>
                                          setEditingNotification({
                                            ...editingNotification,
                                            message: e.target.value,
                                          })
                                        }
                                        className="text-right"
                                        rows={4}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium mb-2 block text-right">
                                        النوع
                                      </label>
                                      <Select
                                        value={editingNotification.type}
                                        onValueChange={(value) =>
                                          setEditingNotification({
                                            ...editingNotification,
                                            type: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="system">نظام</SelectItem>
                                          <SelectItem value="message">رسالة</SelectItem>
                                          <SelectItem value="sale">بيع</SelectItem>
                                          <SelectItem value="bid">مزايدة</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={handleUpdate} className="w-full">
                                      حفظ التغييرات
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardNotifications;