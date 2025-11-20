import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import { convertArabicToEnglishNumbers } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

const AddListing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
      }
    });

    fetchCategories();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    
    if (data) {
      setCategories(data);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedImages.length + files.length > 2) {
      toast.error("يمكنك رفع صورتين كحد أقصى");
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      toast.error("نوع الصورة يجب أن يكون JPG أو PNG أو WEBP");
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }

    const title = formData.get("title") as string;
    const priceStr = formData.get("price") as string;
    const location = formData.get("location") as string;

    if (!title || !priceStr || !location) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      toast.error("يرجى إدخال سعر صحيح");
      setIsLoading(false);
      return;
    }

    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        toast.info("جاري رفع الصور...");
        imageUrls = await uploadImages(user.id);
      }

      const listingData = {
        user_id: user.id,
        title: title,
        description: formData.get("description") as string || null,
        price: price,
        category_id: selectedCategory || null,
        location: location,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: "active",
      };

      const { error } = await supabase
        .from("listings")
        .insert([listingData]);

      if (error) {
        console.error("Error creating listing:", error);
        toast.error("خطأ في نشر الإعلان", {
          description: error.message,
        });
      } else {
        toast.success("تم نشر الإعلان بنجاح!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ في رفع الصور", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">أضف إعلانك</h1>
            <p className="text-muted-foreground">املأ البيانات التالية لنشر إعلانك</p>
          </div>

          <Card className="p-6 md:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الإعلان *</Label>
                <Input 
                  id="title" 
                  name="title"
                  placeholder="مثال: سيارة للبيع - تويوتا كامري 2020"
                  className="text-right"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select dir="rtl" value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ريال) *</Label>
                  <Input 
                    id="price" 
                    name="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    className="text-right"
                    onChange={(e) => {
                      e.target.value = convertArabicToEnglishNumbers(e.target.value);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">الموقع *</Label>
                <Input 
                  id="location" 
                  name="location"
                  placeholder="المدينة أو المنطقة"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea 
                  id="description"
                  name="description"
                  placeholder="اكتب وصفاً تفصيلياً للإعلان..."
                  className="min-h-32 text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>الصور (حتى صورتين)</Label>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`معاينة ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedImages.length < 2 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        انقر لاختيار الصور
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى صورتين، كل صورة حتى 5MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WEBP
                      </p>
                    </label>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
                  disabled={isLoading || uploadingImages}
                >
                  {uploadingImages ? "جاري رفع الصور..." : isLoading ? "جاري النشر..." : "نشر الإعلان"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                  disabled={isLoading || uploadingImages}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddListing;
