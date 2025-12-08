import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Image, 
  Plus, 
  Pencil, 
  Trash2, 
  ExternalLink,
  LayoutGrid
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DashboardPromotionalBanners = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "1",
    is_active: true,
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-promotional-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotional_banners")
        .select("*")
        .order("position");

      if (error) throw error;
      return data as PromotionalBanner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const bannerData = {
        title: data.title,
        image_url: data.image_url,
        link_url: data.link_url || null,
        position: parseInt(data.position),
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase
          .from("promotional_banners")
          .update(bannerData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("promotional_banners")
          .insert(bannerData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-banners"] });
      toast.success(editingBanner ? "تم تحديث البنر بنجاح" : "تم إضافة البنر بنجاح");
      resetForm();
    },
    onError: (error) => {
      console.error("Error saving banner:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotional_banners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-banners"] });
      toast.success("تم حذف البنر بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحذف");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("promotional_banners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-banners"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-banners"] });
      toast.success("تم تحديث حالة البنر");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      position: "1",
      is_active: true,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      position: banner.position.toString(),
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingBanner?.id,
    });
  };

  const getPositionLabel = (position: number) => {
    if (position === 4) return "البنر الجانبي";
    return `البنر ${position}`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                  <LayoutGrid className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">إدارة البنرات الترويجية</h1>
                  <p className="text-sm text-muted-foreground">إدارة البنرات الصورية في الصفحة الرئيسية</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="gap-2"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة بنر جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>عنوان البنر</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="أدخل عنوان البنر"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>رابط الصورة</Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                      {formData.image_url && (
                        <div className="mt-2 rounded-lg overflow-hidden border">
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=صورة+غير+صالحة';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>رابط النقر (اختياري)</Label>
                      <Input
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder="/catalog أو https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>موقع البنر</Label>
                      <Select
                        value={formData.position}
                        onValueChange={(value) => setFormData({ ...formData, position: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">البنر 1 (يسار)</SelectItem>
                          <SelectItem value="2">البنر 2 (وسط)</SelectItem>
                          <SelectItem value="3">البنر 3 (يمين)</SelectItem>
                          <SelectItem value="4">البنر الجانبي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>نشط</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  معاينة البنرات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((pos) => {
                      const banner = banners.find(b => b.position === pos);
                      return (
                        <div 
                          key={pos}
                          className={`relative h-40 rounded-xl overflow-hidden border-2 border-dashed ${banner ? 'border-primary' : 'border-muted'}`}
                        >
                          {banner ? (
                            <>
                              <img 
                                src={banner.image_url} 
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold">{banner.title}</span>
                              </div>
                              {!banner.is_active && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                  غير نشط
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/50">
                              <span className="text-muted-foreground">البنر {pos}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-40 lg:h-full">
                    {(() => {
                      const sideBanner = banners.find(b => b.position === 4);
                      return (
                        <div className={`relative h-full min-h-[160px] rounded-xl overflow-hidden border-2 border-dashed ${sideBanner ? 'border-primary' : 'border-muted'}`}>
                          {sideBanner ? (
                            <>
                              <img 
                                src={sideBanner.image_url} 
                                alt={sideBanner.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold">{sideBanner.title}</span>
                              </div>
                              {!sideBanner.is_active && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                  غير نشط
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/50">
                              <span className="text-muted-foreground">البنر الجانبي</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banners List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة البنرات</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد بنرات</div>
                ) : (
                  <div className="space-y-3">
                    {banners.map((banner) => (
                      <div 
                        key={banner.id}
                        className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                      >
                        <img 
                          src={banner.image_url} 
                          alt={banner.title}
                          className="w-20 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">{banner.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getPositionLabel(banner.position)}
                          </p>
                          {banner.link_url && (
                            <p className="text-xs text-primary truncate flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {banner.link_url}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={banner.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: banner.id, is_active: checked })
                            }
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(banner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا البنر؟")) {
                                deleteMutation.mutate(banner.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPromotionalBanners;
