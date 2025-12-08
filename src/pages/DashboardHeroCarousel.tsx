import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Eye, ExternalLink, RefreshCw, Link as LinkIcon, BarChart3, Palette, GripVertical, Sparkles, Settings2, Play, Layers, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  bg_color: "from-primary to-primary/70",
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

const colorPresets = [
  { name: "أخضر", value: "from-primary to-primary/70", preview: "bg-gradient-to-br from-primary to-primary/70" },
  { name: "أزرق", value: "from-blue-600 to-blue-800", preview: "bg-gradient-to-br from-blue-600 to-blue-800" },
  { name: "بنفسجي", value: "from-purple-600 to-purple-800", preview: "bg-gradient-to-br from-purple-600 to-purple-800" },
  { name: "برتقالي", value: "from-orange-500 to-orange-700", preview: "bg-gradient-to-br from-orange-500 to-orange-700" },
  { name: "وردي", value: "from-pink-500 to-pink-700", preview: "bg-gradient-to-br from-pink-500 to-pink-700" },
  { name: "أحمر", value: "from-red-600 to-red-800", preview: "bg-gradient-to-br from-red-600 to-red-800" },
  { name: "ذهبي", value: "from-amber-500 to-yellow-600", preview: "bg-gradient-to-br from-amber-500 to-yellow-600" },
  { name: "سماوي", value: "from-cyan-500 to-teal-600", preview: "bg-gradient-to-br from-cyan-500 to-teal-600" },
];

export default function DashboardHeroCarousel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
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
    setActiveTab("content");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData(defaultFormData);
    setImageFile(null);
    setActiveTab("content");
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

  const getGradientStyle = (bgColor: string) => {
    // Parse the tailwind gradient classes to inline styles for preview
    const gradientMap: Record<string, string> = {
      "from-primary to-primary/70": "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
      "from-blue-600 to-blue-800": "linear-gradient(to bottom right, #2563eb, #1e40af)",
      "from-purple-600 to-purple-800": "linear-gradient(to bottom right, #9333ea, #6b21a8)",
      "from-orange-500 to-orange-700": "linear-gradient(to bottom right, #f97316, #c2410c)",
      "from-pink-500 to-pink-700": "linear-gradient(to bottom right, #ec4899, #be185d)",
      "from-red-600 to-red-800": "linear-gradient(to bottom right, #dc2626, #991b1b)",
      "from-amber-500 to-yellow-600": "linear-gradient(to bottom right, #f59e0b, #ca8a04)",
      "from-cyan-500 to-teal-600": "linear-gradient(to bottom right, #06b6d4, #0d9488)",
    };
    return gradientMap[bgColor] || gradientMap["from-primary to-primary/70"];
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">إدارة شرائح Hero</h1>
                    <p className="text-xs text-muted-foreground">تحكم في محتوى وتصميم الشرائح الرئيسية</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 ml-2" />
                      معاينة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0">
                    <DialogHeader className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <DialogTitle>معاينة مباشرة للصفحة الرئيسية</DialogTitle>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleRefreshPreview}>
                            <RefreshCw className="w-4 h-4 ml-2" />
                            تحديث
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open("/", "_blank")}>
                            <ExternalLink className="w-4 h-4 ml-2" />
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
              </div>
            </div>
          </header>

          <main className="container mx-auto p-6 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الشرائح</p>
                      <p className="text-3xl font-bold text-primary">{slides?.length || 0}</p>
                    </div>
                    <Layers className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">شرائح نشطة</p>
                      <p className="text-3xl font-bold text-green-600">{slides?.filter(s => s.is_active).length || 0}</p>
                    </div>
                    <Play className="w-10 h-10 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">شرائح غير نشطة</p>
                      <p className="text-3xl font-bold text-orange-600">{slides?.filter(s => !s.is_active).length || 0}</p>
                    </div>
                    <Settings2 className="w-10 h-10 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">آخر تحديث</p>
                      <p className="text-sm font-medium text-purple-600">
                        {slides?.[0]?.updated_at ? new Date(slides[0].updated_at).toLocaleDateString('en-US') : '-'}
                      </p>
                    </div>
                    <Sparkles className="w-10 h-10 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add New Slide Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">الشرائح المتاحة</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingSlide(null); setFormData(defaultFormData); }}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة شريحة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                      {editingSlide ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingSlide ? "تعديل الشريحة" : "إضافة شريحة جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      قم بتخصيص محتوى وتصميم الشريحة حسب رغبتك
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-6">
                      <TabsList className="grid w-full grid-cols-5 mb-4">
                        <TabsTrigger value="content" className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          المحتوى
                        </TabsTrigger>
                        <TabsTrigger value="design" className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          التصميم
                        </TabsTrigger>
                        <TabsTrigger value="cta" className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          الأزرار
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          الإحصائيات
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          معاينة
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <ScrollArea className="h-[60vh] px-6">
                      <TabsContent value="content" className="mt-0 space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">الشارة العلوية</CardTitle>
                            <CardDescription>النص الذي يظهر في الشارة أعلى الشريحة</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Input
                              value={formData.badge_text}
                              onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                              placeholder="🏆 منصة المزادات الأولى في المملكة"
                            />
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">النصوص الرئيسية</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>الوصف (يظهر فوق العنوان)</Label>
                              <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="اكتشف عالم المزادات الفاخرة"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>العنوان الرئيسي *</Label>
                              <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="mt-2 text-lg"
                              />
                            </div>
                            <div>
                              <Label>العنوان الفرعي</Label>
                              <Input
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                className="mt-2"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">إعدادات العرض</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>ترتيب العرض</Label>
                                <Input
                                  type="number"
                                  value={formData.display_order}
                                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <Label htmlFor="is_active">الشريحة نشطة</Label>
                                <Switch
                                  id="is_active"
                                  checked={formData.is_active}
                                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="design" className="mt-0 space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">صورة الخلفية</CardTitle>
                            <CardDescription>اختر صورة للخلفية (اختياري)</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="flex-1"
                              />
                              {(imageFile || editingSlide?.image_url) && (
                                <Badge variant="secondary" className="gap-1">
                                  <ImageIcon className="w-3 h-3" />
                                  صورة محملة
                                </Badge>
                              )}
                            </div>
                            {(imageFile || editingSlide?.image_url) && (
                              <div className="mt-4">
                                <img
                                  src={imageFile ? URL.createObjectURL(imageFile) : editingSlide?.image_url || ""}
                                  alt="Preview"
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">لون الخلفية التدريجي</CardTitle>
                            <CardDescription>اختر أحد الألوان الجاهزة أو أدخل لونًا مخصصًا</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                              {colorPresets.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, bg_color: color.value })}
                                  className={`relative h-20 rounded-xl ${color.preview} transition-all hover:scale-105 ${
                                    formData.bg_color === color.value ? "ring-4 ring-foreground ring-offset-2" : ""
                                  }`}
                                >
                                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-medium bg-black/30 px-2 py-0.5 rounded">
                                    {color.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <Separator />
                            <div>
                              <Label>لون مخصص (Tailwind gradient classes)</Label>
                              <Input
                                value={formData.bg_color}
                                onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                                placeholder="from-primary to-primary/70"
                                className="mt-2 font-mono text-sm"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="cta" className="mt-0 space-y-6">
                        <Card className="border-primary/30">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">الزر الرئيسي</CardTitle>
                                <CardDescription>الزر الأول والأكثر بروزًا</CardDescription>
                              </div>
                              <Button className="bg-white text-primary hover:bg-white/90 shadow-lg">
                                {formData.cta_primary_text || "سجّل الآن مجاناً"}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>نص الزر</Label>
                                <Input
                                  value={formData.cta_primary_text}
                                  onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
                                  placeholder="سجّل الآن مجاناً"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label>رابط الزر</Label>
                                <Input
                                  value={formData.cta_primary_link}
                                  onChange={(e) => setFormData({ ...formData, cta_primary_link: e.target.value })}
                                  placeholder="/auth"
                                  className="mt-2"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                              <Palette className="w-3 h-3" />
                              الزر يظهر بخلفية بيضاء ونص بلون الموقع الأساسي
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-border/50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">الزر الثانوي</CardTitle>
                                <CardDescription>زر إضافي بتصميم شفاف</CardDescription>
                              </div>
                              <Button variant="outline" className="border-2 border-white text-foreground bg-white/10 hover:bg-white/20">
                                {formData.cta_secondary_text || "تصفح المزادات"}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>نص الزر</Label>
                                <Input
                                  value={formData.cta_secondary_text}
                                  onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                                  placeholder="تصفح المزادات"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label>رابط الزر</Label>
                                <Input
                                  value={formData.cta_secondary_link}
                                  onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
                                  placeholder="/auctions"
                                  className="mt-2"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                              <Palette className="w-3 h-3" />
                              الزر يظهر بخلفية شفافة مع حدود بيضاء
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="stats" className="mt-0 space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">إحصائيات Hero</CardTitle>
                                <CardDescription>أضف إحصائيات تظهر أسفل الشريحة</CardDescription>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={addStat}>
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة إحصائية
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {formData.stats.map((stat, index) => (
                              <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">إحصائية {index + 1}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStat(index)}
                                    className="text-destructive hover:text-destructive"
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
                                      className="mt-2"
                                    />
                                  </div>
                                  <div>
                                    <Label>التسمية</Label>
                                    <Input
                                      value={stat.label}
                                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                                      placeholder="مزاد نشط"
                                      className="mt-2"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            {formData.stats.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد إحصائيات. اضغط على "إضافة إحصائية" للبدء.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="preview" className="mt-0">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">معاينة الشريحة</CardTitle>
                            <CardDescription>هكذا ستظهر الشريحة على الموقع</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div 
                              className="relative overflow-hidden h-[400px] rounded-xl"
                              style={{ background: getGradientStyle(formData.bg_color) }}
                            >
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
                                {formData.description && (
                                  <p className="text-lg text-white/90 mb-2">{formData.description}</p>
                                )}
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                                  {formData.title || "العنوان الرئيسي"}
                                </h2>
                                {formData.subtitle && (
                                  <p className="text-xl text-white/80 mb-4">{formData.subtitle}</p>
                                )}
                                <div className="flex gap-3 mb-4">
                                  {formData.cta_primary_text && (
                                    <Button className="bg-white text-primary hover:bg-white/90">
                                      {formData.cta_primary_text}
                                    </Button>
                                  )}
                                  {formData.cta_secondary_text && (
                                    <Button variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white/20">
                                      {formData.cta_secondary_text}
                                    </Button>
                                  )}
                                </div>
                                {formData.stats.length > 0 && (
                                  <div className="flex gap-8 text-white/90 text-sm">
                                    {formData.stats.map((stat, index) => (
                                      <div key={index} className="text-center">
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="opacity-80">{stat.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </ScrollArea>

                    <div className="flex gap-2 p-6 pt-4 border-t bg-muted/30">
                      <Button onClick={handleSubmit} disabled={uploadingImage || !formData.title} className="flex-1">
                        {uploadingImage ? (
                          <>
                            <Upload className="w-4 h-4 ml-2 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>{editingSlide ? "حفظ التغييرات" : "إضافة الشريحة"}</>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        إلغاء
                      </Button>
                    </div>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            {/* Slides Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {slides?.map((slide, index) => (
                <Card 
                  key={slide.id} 
                  className={`overflow-hidden hover:shadow-lg transition-all ${!slide.is_active ? 'opacity-60' : ''}`}
                >
                  {/* Color Preview Header */}
                  <div 
                    className="h-40 relative"
                    style={{ background: getGradientStyle(slide.bg_color) }}
                  >
                    {slide.image_url && (
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg line-clamp-1">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-white/80 text-sm line-clamp-1">{slide.subtitle}</p>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Badge variant={slide.is_active ? "default" : "secondary"} className="text-xs">
                        {slide.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Description */}
                    {slide.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{slide.description}</p>
                    )}

                    {/* Buttons Preview */}
                    <div className="flex flex-wrap gap-2">
                      {slide.cta_primary_text && (
                        <Badge variant="default" className="text-xs">
                          {slide.cta_primary_text}
                        </Badge>
                      )}
                      {slide.cta_secondary_text && (
                        <Badge variant="outline" className="text-xs">
                          {slide.cta_secondary_text}
                        </Badge>
                      )}
                    </div>

                    {/* Stats Preview */}
                    {parseStats(slide.stats).length > 0 && (
                      <div className="flex gap-3 text-xs">
                        {parseStats(slide.stats).slice(0, 3).map((stat, i) => (
                          <div key={i} className="bg-muted px-2 py-1 rounded">
                            <span className="font-bold">{stat.value}</span> {stat.label}
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        ترتيب: {slide.display_order}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(slide)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(slide.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {slides?.length === 0 && (
              <div className="text-center py-16">
                <Layers className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد شرائح</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإضافة شريحة جديدة للظهور في الصفحة الرئيسية</p>
                <Button onClick={() => { setEditingSlide(null); setFormData(defaultFormData); setIsDialogOpen(true); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة شريحة
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
