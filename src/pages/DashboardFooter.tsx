import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";

interface FooterSettings {
  id: string;
  brand_name: string;
  brand_description: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  phone: string;
  email: string;
  address: string;
  copyright_text: string;
  is_active: boolean;
}

const DashboardFooter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FooterSettings>({
    id: "",
    brand_name: "Podgram",
    brand_description: "المنصة الأولى للمنتجات الفاخرة في المنطقة",
    facebook_url: "https://facebook.com",
    instagram_url: "https://instagram.com",
    twitter_url: "https://twitter.com",
    linkedin_url: "https://linkedin.com",
    youtube_url: "https://youtube.com",
    phone: "+966 50 123 4567",
    email: "info@podgram.com",
    address: "الرياض، المملكة العربية السعودية",
    copyright_text: "Podgram. جميع الحقوق محفوظة.",
    is_active: true,
  });

  useEffect(() => {
    checkAdminAccess();
    fetchSettings();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate("/");
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("footer_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error fetching footer settings:", error);
      toast.error("حدث خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("footer_settings")
        .update({
          brand_name: settings.brand_name,
          brand_description: settings.brand_description,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          twitter_url: settings.twitter_url,
          linkedin_url: settings.linkedin_url,
          youtube_url: settings.youtube_url,
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          copyright_text: settings.copyright_text,
          is_active: settings.is_active,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("تم حفظ التغييرات بنجاح");
    } catch (error) {
      console.error("Error saving footer settings:", error);
      toast.error("حدث خطأ في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة محتوى الفوتر</h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <p className="text-muted-foreground">
            قم بتعديل محتوى الفوتر وروابط التواصل الاجتماعي ومعلومات الاتصال
          </p>
        </div>

        {/* Preview */}
        <div className="mb-8 p-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
          <h3 className="text-lg font-semibold mb-4">معاينة مباشرة:</h3>
          <Footer />
        </div>

        {/* Settings Form */}
        <div className="space-y-8 bg-card p-6 rounded-lg border shadow-sm">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">معلومات العلامة التجارية</h3>
            
            <div className="space-y-2">
              <Label htmlFor="brand_name">اسم العلامة التجارية</Label>
              <Input
                id="brand_name"
                value={settings.brand_name}
                onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                placeholder="Podgram"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_description">وصف العلامة التجارية</Label>
              <Textarea
                id="brand_description"
                value={settings.brand_description}
                onChange={(e) => setSettings({ ...settings, brand_description: e.target.value })}
                placeholder="المنصة الأولى للمنتجات الفاخرة"
                rows={3}
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">روابط التواصل الاجتماعي</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  placeholder="https://facebook.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  placeholder="https://instagram.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter</Label>
                <Input
                  id="twitter_url"
                  value={settings.twitter_url}
                  onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                  placeholder="https://twitter.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  value={settings.linkedin_url}
                  onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube</Label>
                <Input
                  id="youtube_url"
                  value={settings.youtube_url}
                  onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                  placeholder="https://youtube.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">معلومات الاتصال</h3>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+966 50 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="info@podgram.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="الرياض، المملكة العربية السعودية"
              />
            </div>
          </div>

          {/* Copyright */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">نص حقوق النشر</h3>
            
            <div className="space-y-2">
              <Label htmlFor="copyright_text">نص حقوق النشر</Label>
              <Input
                id="copyright_text"
                value={settings.copyright_text}
                onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                placeholder="Podgram. جميع الحقوق محفوظة."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </div>
        </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardFooter;