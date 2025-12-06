import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Edit, Eye, EyeOff, ExternalLink, Save, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_active: boolean;
  updated_at: string;
}

const DashboardStaticPages = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNewPage, setIsNewPage] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchPages();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      toast.error("ليس لديك صلاحية الوصول لهذه الصفحة");
    }
  };

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("static_pages")
      .select("*")
      .order("title", { ascending: true });

    if (error) {
      toast.error("حدث خطأ أثناء جلب الصفحات");
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (page: StaticPage) => {
    setEditingPage({ ...page });
    setIsNewPage(false);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPage({
      id: "",
      slug: "",
      title: "",
      content: "",
      meta_description: "",
      is_active: true,
      updated_at: new Date().toISOString()
    });
    setIsNewPage(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPage) return;

    if (!editingPage.slug || !editingPage.title) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (isNewPage) {
      const { error } = await supabase
        .from("static_pages")
        .insert({
          slug: editingPage.slug,
          title: editingPage.title,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          is_active: editingPage.is_active,
          updated_by: user?.id
        });

      if (error) {
        toast.error("حدث خطأ أثناء إضافة الصفحة");
      } else {
        toast.success("تم إضافة الصفحة بنجاح");
        setIsDialogOpen(false);
        fetchPages();
      }
    } else {
      const { error } = await supabase
        .from("static_pages")
        .update({
          title: editingPage.title,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          is_active: editingPage.is_active,
          updated_by: user?.id
        })
        .eq("id", editingPage.id);

      if (error) {
        toast.error("حدث خطأ أثناء حفظ التغييرات");
      } else {
        toast.success("تم حفظ التغييرات بنجاح");
        setIsDialogOpen(false);
        fetchPages();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصفحة؟")) return;

    const { error } = await supabase
      .from("static_pages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("حدث خطأ أثناء حذف الصفحة");
    } else {
      toast.success("تم حذف الصفحة بنجاح");
      fetchPages();
    }
  };

  const handleToggleActive = async (page: StaticPage) => {
    const { error } = await supabase
      .from("static_pages")
      .update({ is_active: !page.is_active })
      .eq("id", page.id);

    if (error) {
      toast.error("حدث خطأ أثناء تغيير حالة الصفحة");
    } else {
      toast.success(page.is_active ? "تم إخفاء الصفحة" : "تم تفعيل الصفحة");
      fetchPages();
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b px-6" dir="rtl">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">إدارة الصفحات الفرعية</h1>
          </header>
          <main className="p-6" dir="rtl">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between gap-4 border-b px-6" dir="rtl">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">إدارة الصفحات الفرعية</h1>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            صفحة جديدة
          </Button>
        </header>

        <main className="p-6" dir="rtl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card key={page.id} className={!page.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {page.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">/{page.slug}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(page)}
                      className="flex-1 gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${page.slug}`, "_blank")}
                      className="gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(page)}
                    >
                      {page.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {isNewPage ? "إضافة صفحة جديدة" : `تعديل: ${editingPage?.title}`}
                </DialogTitle>
              </DialogHeader>

              {editingPage && (
                <div className="space-y-6 py-4">
                  {isNewPage && (
                    <div className="space-y-2">
                      <Label htmlFor="slug">الرابط (Slug) *</Label>
                      <Input
                        id="slug"
                        value={editingPage.slug}
                        onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="مثال: about-us"
                        dir="ltr"
                        className="text-left"
                      />
                      <p className="text-xs text-muted-foreground">سيظهر في الرابط: /{editingPage.slug || "..."}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان الصفحة *</Label>
                    <Input
                      id="title"
                      value={editingPage.title}
                      onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                      placeholder="أدخل عنوان الصفحة"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">وصف SEO</Label>
                    <Textarea
                      id="meta_description"
                      value={editingPage.meta_description || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                      placeholder="وصف قصير للصفحة يظهر في محركات البحث"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">محتوى الصفحة (HTML)</Label>
                    <Textarea
                      id="content"
                      value={editingPage.content}
                      onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                      placeholder="أدخل محتوى الصفحة بتنسيق HTML"
                      rows={15}
                      className="font-mono text-sm"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground">
                      يمكنك استخدام وسوم HTML مثل: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_active"
                      checked={editingPage.is_active}
                      onCheckedChange={(checked) => setEditingPage({ ...editingPage, is_active: checked })}
                    />
                    <Label htmlFor="is_active">الصفحة مفعلة ومرئية</Label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardStaticPages;
