import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Eye, Phone, Clock, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

interface TopBarSettings {
  id: string;
  title: string;
  delivery_text: string;
  working_hours: string;
  cta_text: string;
  cta_link: string;
  phone_number: string | null;
  is_active: boolean;
  background_color: string;
  text_color: string;
}

const DashboardTopBar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TopBarSettings>({
    id: "",
    title: "Podgram - أول منصة فاخرة في المنطقة",
    delivery_text: "توصيل سريع وآمن",
    working_hours: "من 9:00 إلى 21:00",
    cta_text: "بيع منتجك",
    cta_link: "/add-listing",
    phone_number: "+966 50 123 4567",
    is_active: true,
    background_color: "#1a1a1a",
    text_color: "#ffffff",
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
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate("/");
      return;
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("top_bar_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      toast.error("فشل تحميل الإعدادات");
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("top_bar_settings")
      .update({
        title: settings.title,
        delivery_text: settings.delivery_text,
        working_hours: settings.working_hours,
        cta_text: settings.cta_text,
        cta_link: settings.cta_link,
        phone_number: settings.phone_number,
        background_color: settings.background_color,
        text_color: settings.text_color,
      })
      .eq("id", settings.id);

    if (error) {
      toast.error("فشل حفظ التغييرات");
      console.error(error);
    } else {
      toast.success("تم حفظ التغييرات بنجاح");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            إعدادات الشريط العلوي
          </h1>
          <p className="text-muted-foreground">
            تخصيص محتوى الشريط العلوي الذي يظهر في جميع صفحات الموقع
          </p>
        </div>

        {/* Preview */}
        <Card className="p-4 mb-8 bg-gradient-to-r" style={{ 
          backgroundColor: settings.background_color,
          color: settings.text_color 
        }}>
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{settings.phone_number || "رقم الهاتف"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{settings.working_hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>{settings.delivery_text}</span>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all">
              {settings.cta_text}
            </button>
          </div>
        </Card>

        {/* Settings Form */}
        <div className="grid gap-6">
          {/* Main Content */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                محتوى الشريط العلوي
              </h2>
            </div>
            
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">العنوان الرئيسي</Label>
                <Input
                  id="title"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="Podgram - أول منصة فاخرة في المنطقة"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="delivery">نص التوصيل</Label>
                <Input
                  id="delivery"
                  value={settings.delivery_text}
                  onChange={(e) => setSettings({ ...settings, delivery_text: e.target.value })}
                  placeholder="توصيل سريع وآمن"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours">ساعات العمل</Label>
                <Input
                  id="hours"
                  value={settings.working_hours}
                  onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                  placeholder="من 9:00 إلى 21:00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone_number || ""}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  placeholder="+966 50 123 4567"
                  dir="ltr"
                />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ctaText">نص الزر</Label>
                  <Input
                    id="ctaText"
                    value={settings.cta_text}
                    onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
                    placeholder="بيع منتجك"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ctaLink">رابط الزر</Label>
                  <Input
                    id="ctaLink"
                    value={settings.cta_link}
                    onChange={(e) => setSettings({ ...settings, cta_link: e.target.value })}
                    placeholder="/add-listing"
                    dir="ltr"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bgColor">لون الخلفية (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      type="color"
                      value={settings.background_color}
                      onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={settings.background_color}
                      onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                      placeholder="#1a1a1a"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="textColor">لون النص (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={settings.text_color}
                      onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={settings.text_color}
                      onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                      placeholder="#ffffff"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardTopBar;
