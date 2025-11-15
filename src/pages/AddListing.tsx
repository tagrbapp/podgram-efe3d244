import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

const AddListing = () => {
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
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الإعلان</Label>
                <Input 
                  id="title" 
                  placeholder="مثال: سيارة للبيع - تويوتا كامري 2020"
                  className="text-right"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select dir="rtl">
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cars">سيارات</SelectItem>
                      <SelectItem value="real-estate">عقارات</SelectItem>
                      <SelectItem value="electronics">إلكترونيات</SelectItem>
                      <SelectItem value="fashion">أزياء</SelectItem>
                      <SelectItem value="furniture">أثاث</SelectItem>
                      <SelectItem value="jobs">وظائف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ريال)</Label>
                  <Input 
                    id="price" 
                    type="number"
                    placeholder="0"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">الموقع</Label>
                <Input 
                  id="location" 
                  placeholder="المدينة أو المنطقة"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea 
                  id="description"
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
                    الحد الأقصى 5 صور، كل صورة حتى 5MB
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    placeholder="05xxxxxxxx"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
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
                >
                  نشر الإعلان
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
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
