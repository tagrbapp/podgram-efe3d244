import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { announcementTemplates, AnnouncementTemplate } from "@/lib/announcementTemplates";
import { Sparkles, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Announcement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  created_at: string;
}

const DashboardAnnouncements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [buttonText, setButtonText] = useState("اعرف المزيد");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchAnnouncements();
  }, []);

  const checkAdminAccess = async () => {
    const { user } = await getSession();
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
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("فشل تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setButtonText("اعرف المزيد");
    setIsActive(true);
    setStartDate("");
    setEndDate("");
    setPriority(0);
    setEditingId(null);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setTitle(announcement.title);
      setDescription(announcement.description || "");
      setImageUrl(announcement.image_url || "");
      setLinkUrl(announcement.link_url || "");
      setButtonText(announcement.button_text || "اعرف المزيد");
      setIsActive(announcement.is_active);
      setStartDate(announcement.start_date ? announcement.start_date.split("T")[0] : "");
      setEndDate(announcement.end_date ? announcement.end_date.split("T")[0] : "");
      setPriority(announcement.priority);
      setShowTemplates(false);
    } else {
      resetForm();
      setShowTemplates(true);
    }
    setIsDialogOpen(true);
  };

  const handleSelectTemplate = (template: AnnouncementTemplate) => {
    setTitle(template.title);
    setDescription(template.descriptionText);
    setButtonText(template.buttonText);
    setPriority(template.priority);
    setShowTemplates(false);
    toast.success("تم تطبيق القالب بنجاح");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("يجب إدخال عنوان الإعلان");
      return;
    }

    setSaving(true);

    try {
      const announcementData = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        button_text: buttonText.trim() || null,
        is_active: isActive,
        start_date: startDate || null,
        end_date: endDate || null,
        priority,
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("تم تحديث الإعلان بنجاح");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("announcements")
          .insert({ ...announcementData, created_by: user?.id });

        if (error) throw error;
        toast.success("تم إضافة الإعلان بنجاح");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("فشل حفظ الإعلان");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الإعلان بنجاح");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("فشل حذف الإعلان");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "تم إيقاف الإعلان" : "تم تفعيل الإعلان");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling announcement:", error);
      toast.error("فشل تحديث حالة الإعلان");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-3 mr-4">
              <Megaphone className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة الإعلانات</h1>
            </div>
          </header>

          <main className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  إدارة الإعلانات التي تظهر في الصفحة الرئيسية
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة إعلان جديد
                </Button>
              </div>

              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </Card>
              ) : announcements.length === 0 ? (
                <Card className="p-8 text-center">
                  <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد إعلانات</h3>
                  <p className="text-muted-foreground mb-4">
                    ابدأ بإضافة أول إعلان للموقع
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة إعلان
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold">
                              {announcement.title}
                            </h3>
                            <Badge variant={announcement.is_active ? "default" : "secondary"}>
                              {announcement.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                            {announcement.priority > 0 && (
                              <Badge variant="outline">
                                الأولوية: {announcement.priority}
                              </Badge>
                            )}
                          </div>

                          {announcement.description && (
                            <p className="text-muted-foreground mb-3">
                              {announcement.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {announcement.start_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  من:{" "}
                                  {format(new Date(announcement.start_date), "PPP")}
                                </span>
                              </div>
                            )}
                            {announcement.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  إلى:{" "}
                                  {format(new Date(announcement.end_date), "PPP")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {announcement.image_url && (
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        )}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Switch
                          checked={announcement.is_active}
                          onCheckedChange={() =>
                            toggleActive(announcement.id, announcement.is_active)
                          }
                        />
                        <span className="text-sm">
                          {announcement.is_active ? "نشط" : "غير نشط"}
                        </span>
                        <div className="mr-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(announcement)}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        <div className="order-1">
          <AppSidebar />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </DialogTitle>
            <DialogDescription>
              أضف إعلاناً مؤقتاً يظهر للزوار في الصفحة الرئيسية
            </DialogDescription>
          </DialogHeader>

          {showTemplates ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">اختر قالباً جاهزاً</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(false)}
                >
                  أو ابدأ من الصفر
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {announcementTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <p className="truncate">"{template.title}"</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">تحرير الإعلان</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 ml-2" />
                  معاينة
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-4 mt-4">
                {!editingId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowTemplates(true)}
                  >
                    <Sparkles className="h-4 w-4 ml-2" />
                    اختر من القوالب الجاهزة
                  </Button>
                )}

                <div>
                  <Label htmlFor="title">عنوان الإعلان *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عرض خاص - تخفيضات حتى 50%"
              />
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للإعلان..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="linkUrl">رابط الإعلان</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/catalog?category=offers"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="buttonText">نص الزر</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="اعرف المزيد"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">تاريخ البدء</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">الأولوية (رقم أعلى = أولوية أعلى)</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">نشط</Label>
              </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <p className="text-sm text-muted-foreground mb-4">
                      معاينة كيف سيظهر الإعلان للزوار:
                    </p>
                    
                    {/* Preview of the announcement */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 text-center md:text-right">
                          <h2 className="text-2xl font-bold mb-3 text-foreground">
                            {title || "عنوان الإعلان"}
                          </h2>
                          {description && (
                            <p className="text-muted-foreground mb-4">
                              {description}
                            </p>
                          )}
                          <Button className="bg-primary hover:bg-primary/90">
                            {buttonText || "اعرف المزيد"}
                          </Button>
                        </div>
                        {imageUrl && (
                          <div className="w-full md:w-64 h-48 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={imageUrl}
                              alt="معاينة"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview details */}
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        {priority > 0 && (
                          <Badge variant="outline">الأولوية: {priority}</Badge>
                        )}
                      </div>
                      {(startDate || endDate) && (
                        <p className="text-muted-foreground">
                          {startDate && `من: ${startDate}`}
                          {startDate && endDate && " | "}
                          {endDate && `إلى: ${endDate}`}
                        </p>
                      )}
                      {linkUrl && (
                        <p className="text-muted-foreground">
                          الرابط: <span className="text-primary">{linkUrl}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DashboardAnnouncements;
