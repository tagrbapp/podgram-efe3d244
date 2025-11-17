import { useState } from "react";
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
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandLogos from "@/components/BrandLogos";

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
}

export default function DashboardHeroCarousel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    bg_color: "from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]",
    is_active: true,
    display_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    mutationFn: async (slideData: typeof formData & { image_url?: string }) => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .insert([slideData])
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
      slideData: Partial<typeof formData> & { image_url?: string };
    }) => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .update(slideData)
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

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      bg_color: slide.bg_color,
      is_active: slide.is_active,
      display_order: slide.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      bg_color: "from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]",
      is_active: true,
      display_order: 0,
    });
    setImageFile(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الشريحة؟")) {
      deleteSlideMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة شرائح الـ Hero</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSlide(null)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة شريحة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? "تعديل الشريحة" : "إضافة شريحة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">تعديل</TabsTrigger>
                <TabsTrigger value="preview">معاينة</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">العنوان الرئيسي</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subtitle">العنوان الفرعي</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitle: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

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
                    {editingSlide?.image_url && !imageFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        الصورة الحالية: {editingSlide.image_url.split("/").pop()}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bg_color">لون الخلفية (Tailwind gradient)</Label>
                    <Input
                      id="bg_color"
                      value={formData.bg_color}
                      onChange={(e) =>
                        setFormData({ ...formData, bg_color: e.target.value })
                      }
                      placeholder="from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="display_order">ترتيب العرض</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">نشط</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploadingImage}>
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
                </form>
              </TabsContent>
              <TabsContent value="preview">
                <div className="space-y-4">
                  <div
                    className={`relative overflow-hidden h-[400px] bg-gradient-to-br ${formData.bg_color} rounded-lg`}
                  >
                    {(imageFile || editingSlide?.image_url) && (
                      <img
                        src={
                          imageFile
                            ? URL.createObjectURL(imageFile)
                            : editingSlide?.image_url || ""
                        }
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-10"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
                      <p className="text-lg text-white/90 mb-4">
                        {formData.description || "الوصف"}
                      </p>
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {formData.title || "العنوان الرئيسي"}
                        <br />
                        <span className="text-white/80">
                          {formData.subtitle || "العنوان الفرعي"}
                        </span>
                      </h2>
                      <div className="mt-8">
                        <BrandLogos />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>معاينة حية للشريحة</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slides?.map((slide) => (
          <Card key={slide.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg">{slide.title}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(slide)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(slide.id)}
                  >
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
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                <p className="text-sm">{slide.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      slide.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {slide.is_active ? "نشط" : "غير نشط"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    الترتيب: {slide.display_order}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
