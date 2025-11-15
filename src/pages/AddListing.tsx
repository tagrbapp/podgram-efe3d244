import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

const AddListing = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/auth");
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    
    if (data) {
      setCategories(data);
    }
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

    // التحقق من الحقول المطلوبة
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

    const listingData = {
      user_id: user.id,
      title: title,
      description: formData.get("description") as string || null,
      price: price,
      category_id: selectedCategory || null,
      location: location,
      phone: formData.get("phone") as string || null,
      email: formData.get("email") as string || null,
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

    setIsLoading(false);
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
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className="text-right"
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
                <Label>الصور</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    اسحب الصور هنا أو انقر للاختيار
                  </p>
                  <p className="text-xs text-muted-foreground">
                    سيتم إضافة ميزة رفع الصور قريباً
                  </p>
                </div>
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
                  disabled={isLoading}
                >
                  {isLoading ? "جاري النشر..." : "نشر الإعلان"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                  disabled={isLoading}
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
