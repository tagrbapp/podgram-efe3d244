import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Palette, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThemeSettings {
  id: string;
  theme_name: string;
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  secondary_hue: number;
  secondary_saturation: number;
  secondary_lightness: number;
  background_hue: number;
  background_saturation: number;
  background_lightness: number;
  card_hue: number;
  card_saturation: number;
  card_lightness: number;
  foreground_hue: number;
  foreground_saturation: number;
  foreground_lightness: number;
  accent_hue: number;
  accent_saturation: number;
  accent_lightness: number;
  muted_hue: number;
  muted_saturation: number;
  muted_lightness: number;
  border_hue: number;
  border_saturation: number;
  border_lightness: number;
  destructive_hue: number;
  destructive_saturation: number;
  destructive_lightness: number;
  is_active: boolean;
}

const DashboardTheme = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings | null>(null);

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
        .from("theme_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      toast.error("حدث خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("theme_settings")
        .update({
          theme_name: settings.theme_name,
          primary_hue: settings.primary_hue,
          primary_saturation: settings.primary_saturation,
          primary_lightness: settings.primary_lightness,
          secondary_hue: settings.secondary_hue,
          secondary_saturation: settings.secondary_saturation,
          secondary_lightness: settings.secondary_lightness,
          background_hue: settings.background_hue,
          background_saturation: settings.background_saturation,
          background_lightness: settings.background_lightness,
          card_hue: settings.card_hue,
          card_saturation: settings.card_saturation,
          card_lightness: settings.card_lightness,
          foreground_hue: settings.foreground_hue,
          foreground_saturation: settings.foreground_saturation,
          foreground_lightness: settings.foreground_lightness,
          accent_hue: settings.accent_hue,
          accent_saturation: settings.accent_saturation,
          accent_lightness: settings.accent_lightness,
          muted_hue: settings.muted_hue,
          muted_saturation: settings.muted_saturation,
          muted_lightness: settings.muted_lightness,
          border_hue: settings.border_hue,
          border_saturation: settings.border_saturation,
          border_lightness: settings.border_lightness,
          destructive_hue: settings.destructive_hue,
          destructive_saturation: settings.destructive_saturation,
          destructive_lightness: settings.destructive_lightness,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("تم حفظ التغييرات بنجاح");
    } catch (error) {
      console.error("Error saving theme settings:", error);
      toast.error("حدث خطأ في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    toast.info("تم استعادة الإعدادات الأصلية");
  };

  const ColorControl = ({ 
    label, 
    hue, 
    saturation, 
    lightness, 
    onHueChange, 
    onSaturationChange, 
    onLightnessChange 
  }: {
    label: string;
    hue: number;
    saturation: number;
    lightness: number;
    onHueChange: (value: number) => void;
    onSaturationChange: (value: number) => void;
    onLightnessChange: (value: number) => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full border-2 border-border"
            style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
          />
          {label}
        </CardTitle>
        <CardDescription>HSL: {hue}, {saturation}%, {lightness}%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Hue (درجة اللون): {hue}</Label>
          <Slider
            value={[hue]}
            onValueChange={([value]) => onHueChange(value)}
            max={360}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Saturation (التشبع): {saturation}%</Label>
          <Slider
            value={[saturation]}
            onValueChange={([value]) => onSaturationChange(value)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Lightness (السطوع): {lightness}%</Label>
          <Slider
            value={[lightness]}
            onValueChange={([value]) => onLightnessChange(value)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إدارة ألوان الموقع</h1>
          </div>
          <p className="text-muted-foreground">
            قم بتخصيص ألوان الموقع بالكامل باستخدام نظام HSL. التغييرات تظهر مباشرة على جميع الصفحات.
          </p>
        </div>

        {/* Theme Name */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اسم الثيم</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={settings.theme_name}
              onChange={(e) => setSettings({ ...settings, theme_name: e.target.value })}
              placeholder="اسم الثيم"
            />
          </CardContent>
        </Card>

        {/* Color Controls */}
        <Tabs defaultValue="primary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="primary">الأساسي</TabsTrigger>
            <TabsTrigger value="secondary">الثانوي</TabsTrigger>
            <TabsTrigger value="background">الخلفية</TabsTrigger>
            <TabsTrigger value="card">الكروت</TabsTrigger>
            <TabsTrigger value="foreground">النص</TabsTrigger>
            <TabsTrigger value="accent">التمييز</TabsTrigger>
            <TabsTrigger value="muted">الخافت</TabsTrigger>
            <TabsTrigger value="destructive">التحذيري</TabsTrigger>
          </TabsList>

          <TabsContent value="primary">
            <ColorControl
              label="اللون الأساسي (Primary)"
              hue={settings.primary_hue}
              saturation={settings.primary_saturation}
              lightness={settings.primary_lightness}
              onHueChange={(value) => setSettings({ ...settings, primary_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, primary_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, primary_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="secondary">
            <ColorControl
              label="اللون الثانوي (Secondary)"
              hue={settings.secondary_hue}
              saturation={settings.secondary_saturation}
              lightness={settings.secondary_lightness}
              onHueChange={(value) => setSettings({ ...settings, secondary_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, secondary_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, secondary_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="background">
            <ColorControl
              label="لون الخلفية (Background)"
              hue={settings.background_hue}
              saturation={settings.background_saturation}
              lightness={settings.background_lightness}
              onHueChange={(value) => setSettings({ ...settings, background_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, background_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, background_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="card">
            <ColorControl
              label="لون الكروت (Card)"
              hue={settings.card_hue}
              saturation={settings.card_saturation}
              lightness={settings.card_lightness}
              onHueChange={(value) => setSettings({ ...settings, card_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, card_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, card_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="foreground">
            <ColorControl
              label="لون النص (Foreground)"
              hue={settings.foreground_hue}
              saturation={settings.foreground_saturation}
              lightness={settings.foreground_lightness}
              onHueChange={(value) => setSettings({ ...settings, foreground_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, foreground_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, foreground_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="accent">
            <ColorControl
              label="لون التمييز (Accent)"
              hue={settings.accent_hue}
              saturation={settings.accent_saturation}
              lightness={settings.accent_lightness}
              onHueChange={(value) => setSettings({ ...settings, accent_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, accent_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, accent_lightness: value })}
            />
          </TabsContent>

          <TabsContent value="muted">
            <div className="grid gap-6 md:grid-cols-2">
              <ColorControl
                label="لون الخافت (Muted)"
                hue={settings.muted_hue}
                saturation={settings.muted_saturation}
                lightness={settings.muted_lightness}
                onHueChange={(value) => setSettings({ ...settings, muted_hue: value })}
                onSaturationChange={(value) => setSettings({ ...settings, muted_saturation: value })}
                onLightnessChange={(value) => setSettings({ ...settings, muted_lightness: value })}
              />
              <ColorControl
                label="لون الحدود (Border)"
                hue={settings.border_hue}
                saturation={settings.border_saturation}
                lightness={settings.border_lightness}
                onHueChange={(value) => setSettings({ ...settings, border_hue: value })}
                onSaturationChange={(value) => setSettings({ ...settings, border_saturation: value })}
                onLightnessChange={(value) => setSettings({ ...settings, border_lightness: value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="destructive">
            <ColorControl
              label="اللون التحذيري (Destructive)"
              hue={settings.destructive_hue}
              saturation={settings.destructive_saturation}
              lightness={settings.destructive_lightness}
              onHueChange={(value) => setSettings({ ...settings, destructive_hue: value })}
              onSaturationChange={(value) => setSettings({ ...settings, destructive_saturation: value })}
              onLightnessChange={(value) => setSettings({ ...settings, destructive_lightness: value })}
            />
          </TabsContent>
        </Tabs>

        {/* Preview Section */}
        <Card className="my-6">
          <CardHeader>
            <CardTitle>معاينة الألوان</CardTitle>
            <CardDescription>معاينة سريعة للألوان المختارة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="default">زر أساسي</Button>
              <Button variant="secondary">زر ثانوي</Button>
              <Button variant="outline">زر محدد</Button>
              <Button variant="destructive">زر تحذيري</Button>
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>كارت تجريبي</CardTitle>
                  <CardDescription>هذا مثال على كارت</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">نص عادي في الكارت</p>
                  <p className="text-muted-foreground mt-2">نص خافت في الكارت</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

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
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            استعادة الإعدادات
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

      <Footer />
    </div>
  );
};

export default DashboardTheme;