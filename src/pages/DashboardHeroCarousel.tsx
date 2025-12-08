import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Eye, ExternalLink, RefreshCw, Link as LinkIcon, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandLogos from "@/components/BrandLogos";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";

interface StatItem {
  value: string;
  label: string;
}

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  badge_text: string | null;
  cta_primary_text: string | null;
  cta_primary_link: string | null;
  cta_secondary_text: string | null;
  cta_secondary_link: string | null;
  stats: unknown;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  bg_color: string;
  is_active: boolean;
  display_order: number;
  badge_text: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
  stats: StatItem[];
}

const defaultFormData: FormData = {
  title: "",
  subtitle: "",
  description: "",
  bg_color: "from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]",
  is_active: true,
  display_order: 0,
  badge_text: "🏆 منصة المزادات الأولى في المملكة",
  cta_primary_text: "سجّل الآن مجاناً",
  cta_primary_link: "/auth",
  cta_secondary_text: "تصفح المزادات",
  cta_secondary_link: "/auctions",
  stats: [
    { value: "+500", label: "مزاد نشط" },
    { value: "+10K", label: "مستخدم مسجل" },
    { value: "+2M", label: "ريال قيمة المبيعات" }
  ]
};

export default function DashboardHeroCarousel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery({
    queryKey: ["carousel-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as CarouselSlide[];
    },
  });

  const createSlideMutation = useMutation({
    mutationFn: async (slideData: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .insert([slideData as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carousel-slides"] });
      toast.success("تم إضافة الشريحة بنجاح");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الشريحة");
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: async ({
      id,
      slideData,
    }: {
      id: string;
      slideData: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .update(slideData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carousel-slides"] });
      toast.success("تم تحديث الشريحة بنجاح");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الشريحة");
    },
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carousel_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carousel-slides"] });
      toast.success("تم حذف الشريحة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الشريحة");
    },
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `carousel/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("listing-images").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = editingSlide?.image_url;

    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const slideData = {
      ...formData,
      image_url: imageUrl,
    };

    if (editingSlide) {
      updateSlideMutation.mutate({ id: editingSlide.id, slideData });
    } else {
      createSlideMutation.mutate(slideData);
    }
  };

  const parseStats = (stats: unknown): StatItem[] => {
    if (!stats) return defaultFormData.stats;
    if (Array.isArray(stats)) return stats as StatItem[];
    if (typeof stats === 'string') {
      try {
        return JSON.parse(stats);
      } catch {
        return defaultFormData.stats;
      }
    }
    return defaultFormData.stats;
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      bg_color: slide.bg_color,
      is_active: slide.is_active,
      display_order: slide.display_order,
      badge_text: slide.badge_text || "",
      cta_primary_text: slide.cta_primary_text || "",
      cta_primary_link: slide.cta_primary_link || "",
      cta_secondary_text: slide.cta_secondary_text || "",
      cta_secondary_link: slide.cta_secondary_link || "",
      stats: parseStats(slide.stats),
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData(defaultFormData);
    setImageFile(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الشريحة؟")) {
      deleteSlideMutation.mutate(id);
    }
  };

  const handleRefreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      toast.success("تم تحديث المعاينة");
    }
  };

  const updateStat = (index: number, field: 'value' | 'label', value: string) => {
    const newStats = [...formData.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setFormData({ ...formData, stats: newStats });
  };

  const addStat = () => {
    setFormData({
      ...formData,
      stats: [...formData.stats, { value: "", label: "" }]
    });
  };

  const removeStat = (index: number) => {
    const newStats = formData.stats.filter((_, i) => i !== index);
    setFormData({ ...formData, stats: newStats });
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <div className="p-8">جاري التحميل...</div>
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
              <ImageIcon className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة شرائح الـ Hero</h1>
            </div>
          </header>
          <main className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      معاينة مباشرة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0">
                    <DialogHeader className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <DialogTitle>معاينة مباشرة للصفحة الرئيسية</DialogTitle>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleRefreshPreview}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            تحديث المعاينة
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open("/", "_blank")}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            فتح في نافذة جديدة
                          </Button>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="w-full h-[calc(90vh-80px)]">
                      <iframe ref={iframeRef} src="/" className="w-full h-full border-0" title="Live Preview" />
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingSlide(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة شريحة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSlide ? "تعديل الشريحة" : "إضافة شريحة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="content">المحتوى</TabsTrigger>
                        <TabsTrigger value="cta">الأزرار</TabsTrigger>
                        <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
                        <TabsTrigger value="preview">معاينة</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content">
                        <form className="space-y-4">
                          <div>
                            <Label htmlFor="badge_text">نص الشارة العلوية</Label>
                            <Input
                              id="badge_text"
                              value={formData.badge_text}
                              onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                              placeholder="🏆 منصة المزادات الأولى في المملكة"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description">الوصف (يظهر فوق العنوان)</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="اكتشف عالم المزادات الفاخرة"
                            />
                          </div>

                          <div>
                            <Label htmlFor="title">العنوان الرئيسي</Label>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="subtitle">العنوان الفرعي</Label>
                            <Input
                              id="subtitle"
                              value={formData.subtitle}
                              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            />
                          </div>

                          <Separator />

                          <div>
                            <Label htmlFor="image">صورة الخلفية</Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                              />
                              {(imageFile || editingSlide?.image_url) && (
                                <ImageIcon className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="bg_color">لون الخلفية (Tailwind gradient)</Label>
                            <Input
                              id="bg_color"
                              value={formData.bg_color}
                              onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                              placeholder="from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="display_order">ترتيب العرض</Label>
                              <Input
                                id="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                required
                              />
                            </div>
                            <div className="flex items-center justify-between pt-6">
                              <Label htmlFor="is_active">نشط</Label>
                              <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                            </div>
                          </div>
                        </form>
                      </TabsContent>

                      <TabsContent value="cta">
                        <div className="space-y-6">
                          <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <LinkIcon className="w-4 h-4" />
                              الزر الرئيسي
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="cta_primary_text">نص الزر</Label>
                                <Input
                                  id="cta_primary_text"
                                  value={formData.cta_primary_text}
                                  onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
                                  placeholder="سجّل الآن مجاناً"
                                />
                              </div>
                              <div>
                                <Label htmlFor="cta_primary_link">رابط الزر</Label>
                                <Input
                                  id="cta_primary_link"
                                  value={formData.cta_primary_link}
                                  onChange={(e) => setFormData({ ...formData, cta_primary_link: e.target.value })}
                                  placeholder="/auth"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <LinkIcon className="w-4 h-4" />
                              الزر الثانوي
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="cta_secondary_text">نص الزر</Label>
                                <Input
                                  id="cta_secondary_text"
                                  value={formData.cta_secondary_text}
                                  onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                                  placeholder="تصفح المزادات"
                                />
                              </div>
                              <div>
                                <Label htmlFor="cta_secondary_link">رابط الزر</Label>
                                <Input
                                  id="cta_secondary_link"
                                  value={formData.cta_secondary_link}
                                  onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
                                  placeholder="/auctions"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="stats">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              إحصائيات Hero
                            </h3>
                            <Button type="button" variant="outline" size="sm" onClick={addStat}>
                              <Plus className="w-4 h-4 mr-2" />
                              إضافة إحصائية
                            </Button>
                          </div>

                          {formData.stats.map((stat, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">إحصائية {index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStat(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>القيمة</Label>
                                  <Input
                                    value={stat.value}
                                    onChange={(e) => updateStat(index, 'value', e.target.value)}
                                    placeholder="+500"
                                  />
                                </div>
                                <div>
                                  <Label>التسمية</Label>
                                  <Input
                                    value={stat.label}
                                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                                    placeholder="مزاد نشط"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="preview">
                        <div className="space-y-4">
                          <div className={`relative overflow-hidden h-[400px] bg-gradient-to-br ${formData.bg_color} rounded-lg`}>
                            {(imageFile || editingSlide?.image_url) && (
                              <img
                                src={imageFile ? URL.createObjectURL(imageFile) : editingSlide?.image_url || ""}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover opacity-20"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
                              {formData.badge_text && (
                                <div className="mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                  <span className="text-white text-sm font-medium">{formData.badge_text}</span>
                                </div>
                              )}
                              <p className="text-lg text-white/90 mb-2">{formData.description || "الوصف"}</p>
                              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                                {formData.title || "العنوان الرئيسي"}
                              </h2>
                              <p className="text-xl text-white/80 mb-4">{formData.subtitle || "العنوان الفرعي"}</p>
                              <div className="flex gap-3 mb-4">
                                {formData.cta_primary_text && (
                                  <Button size="sm" className="bg-white text-primary">
                                    {formData.cta_primary_text}
                                  </Button>
                                )}
                                {formData.cta_secondary_text && (
                                  <Button size="sm" variant="outline" className="border-white text-white">
                                    {formData.cta_secondary_text}
                                  </Button>
                                )}
                              </div>
                              <div className="flex gap-6 text-white/90 text-sm">
                                {formData.stats.map((stat, index) => (
                                  <div key={index} className="text-center">
                                    <p className="text-xl font-bold">{stat.value}</p>
                                    <p className="opacity-80">{stat.label}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Button onClick={handleSubmit} disabled={uploadingImage}>
                        {uploadingImage ? (
                          <>
                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>{editingSlide ? "تحديث" : "إضافة"}</>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        إلغاء
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {slides?.map((slide) => (
                <Card key={slide.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="text-lg">{slide.title}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(slide)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(slide.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {slide.image_url && (
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">{slide.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`px-2 py-1 rounded ${slide.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {slide.is_active ? "نشط" : "غير نشط"}
                        </span>
                        <span>ترتيب: {slide.display_order}</span>
                      </div>
                      {slide.badge_text && (
                        <p className="text-xs text-muted-foreground">الشارة: {slide.badge_text}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
