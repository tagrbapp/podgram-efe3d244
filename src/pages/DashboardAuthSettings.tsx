import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface AuthSettings {
  id: string;
  merchant_title: string;
  merchant_description: string;
  consumer_title: string;
  consumer_description: string;
  membership_section_title: string;
  full_name_label: string;
  full_name_placeholder: string;
  full_name_hint: string;
  email_label: string;
  password_label: string;
  password_hint: string;
  confirm_password_label: string;
  referral_code_label: string;
  register_button_text: string;
  login_tab_text: string;
  register_tab_text: string;
}

const DashboardAuthSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AuthSettings | null>(null);

  useEffect(() => {
    checkAdminAndFetchSettings();
  }, []);

  const checkAdminAndFetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "admin");

      if (!isAdmin) {
        toast.error("غير مصرح لك بالوصول لهذه الصفحة");
        navigate("/dashboard");
        return;
      }

      // Fetch settings
      const { data, error } = await supabase
        .from("auth_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error:", error);
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
        .from("auth_settings")
        .update({
          merchant_title: settings.merchant_title,
          merchant_description: settings.merchant_description,
          consumer_title: settings.consumer_title,
          consumer_description: settings.consumer_description,
          membership_section_title: settings.membership_section_title,
          full_name_label: settings.full_name_label,
          full_name_placeholder: settings.full_name_placeholder,
          full_name_hint: settings.full_name_hint,
          email_label: settings.email_label,
          password_label: settings.password_label,
          password_hint: settings.password_hint,
          confirm_password_label: settings.confirm_password_label,
          referral_code_label: settings.referral_code_label,
          register_button_text: settings.register_button_text,
          login_tab_text: settings.login_tab_text,
          register_tab_text: settings.register_tab_text,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("تم حفظ الإعدادات بنجاح!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="container max-w-4xl mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إعدادات نموذج التسجيل</h1>
        <p className="text-muted-foreground mt-2">
          قم بتخصيص النصوص والمحتوى الظاهر في صفحة التسجيل
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>عناوين التبويبات</CardTitle>
            <CardDescription>النصوص الظاهرة في تبويبات التسجيل وتسجيل الدخول</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register_tab_text">نص تبويب التسجيل</Label>
              <Input
                id="register_tab_text"
                value={settings.register_tab_text}
                onChange={(e) => setSettings({ ...settings, register_tab_text: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login_tab_text">نص تبويب تسجيل الدخول</Label>
              <Input
                id="login_tab_text"
                value={settings.login_tab_text}
                onChange={(e) => setSettings({ ...settings, login_tab_text: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نوع العضوية</CardTitle>
            <CardDescription>إعدادات خيارات نوع العضوية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="membership_section_title">عنوان القسم</Label>
              <Input
                id="membership_section_title"
                value={settings.membership_section_title}
                onChange={(e) => setSettings({ ...settings, membership_section_title: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consumer_title">عنوان المستهلك</Label>
                <Input
                  id="consumer_title"
                  value={settings.consumer_title}
                  onChange={(e) => setSettings({ ...settings, consumer_title: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchant_title">عنوان التاجر</Label>
                <Input
                  id="merchant_title"
                  value={settings.merchant_title}
                  onChange={(e) => setSettings({ ...settings, merchant_title: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_description">وصف المستهلك</Label>
              <Textarea
                id="consumer_description"
                value={settings.consumer_description}
                onChange={(e) => setSettings({ ...settings, consumer_description: e.target.value })}
                className="text-right min-h-20"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant_description">وصف التاجر</Label>
              <Textarea
                id="merchant_description"
                value={settings.merchant_description}
                onChange={(e) => setSettings({ ...settings, merchant_description: e.target.value })}
                className="text-right min-h-20"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تسميات الحقول</CardTitle>
            <CardDescription>تخصيص تسميات حقول النموذج</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name_label">تسمية حقل الاسم</Label>
                <Input
                  id="full_name_label"
                  value={settings.full_name_label}
                  onChange={(e) => setSettings({ ...settings, full_name_label: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name_placeholder">نص الاسم التوضيحي</Label>
                <Input
                  id="full_name_placeholder"
                  value={settings.full_name_placeholder}
                  onChange={(e) => setSettings({ ...settings, full_name_placeholder: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name_hint">نص المساعدة للاسم</Label>
              <Input
                id="full_name_hint"
                value={settings.full_name_hint}
                onChange={(e) => setSettings({ ...settings, full_name_hint: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email_label">تسمية البريد الإلكتروني</Label>
                <Input
                  id="email_label"
                  value={settings.email_label}
                  onChange={(e) => setSettings({ ...settings, email_label: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_label">تسمية كلمة المرور</Label>
                <Input
                  id="password_label"
                  value={settings.password_label}
                  onChange={(e) => setSettings({ ...settings, password_label: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_hint">نص المساعدة لكلمة المرور</Label>
              <Textarea
                id="password_hint"
                value={settings.password_hint}
                onChange={(e) => setSettings({ ...settings, password_hint: e.target.value })}
                className="text-right min-h-20"
                dir="rtl"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="confirm_password_label">تسمية تأكيد كلمة المرور</Label>
                <Input
                  id="confirm_password_label"
                  value={settings.confirm_password_label}
                  onChange={(e) => setSettings({ ...settings, confirm_password_label: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral_code_label">تسمية كود الإحالة</Label>
                <Input
                  id="referral_code_label"
                  value={settings.referral_code_label}
                  onChange={(e) => setSettings({ ...settings, referral_code_label: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>زر التسجيل</CardTitle>
            <CardDescription>نص زر إنشاء الحساب</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="register_button_text">نص الزر</Label>
              <Input
                id="register_button_text"
                value={settings.register_button_text}
                onChange={(e) => setSettings({ ...settings, register_button_text: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

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
  );
};

export default DashboardAuthSettings;