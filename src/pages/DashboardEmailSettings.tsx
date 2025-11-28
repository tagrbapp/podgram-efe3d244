import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowRight, Mail, Save } from "lucide-react";

interface EmailSettings {
  id: string;
  approval_subject: string;
  approval_title: string;
  approval_message: string;
  approval_button_text: string;
  rejection_subject: string;
  rejection_title: string;
  rejection_message: string;
  rejection_footer: string;
  sender_name: string;
  sender_email: string;
  footer_text: string;
}

const DashboardEmailSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings | null>(null);

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "moderator")) {
      toast.error("غير مصرح لك بالوصول");
      navigate("/dashboard");
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error("Error fetching email settings:", error);
      toast.error("فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_settings")
        .update({
          approval_subject: settings.approval_subject,
          approval_title: settings.approval_title,
          approval_message: settings.approval_message,
          approval_button_text: settings.approval_button_text,
          rejection_subject: settings.rejection_subject,
          rejection_title: settings.rejection_title,
          rejection_message: settings.rejection_message,
          rejection_footer: settings.rejection_footer,
          sender_name: settings.sender_name,
          sender_email: settings.sender_email,
          footer_text: settings.footer_text,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">لم يتم العثور على إعدادات</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إعدادات البريد الإلكتروني</h1>
        <p className="text-muted-foreground">
          تحكم في رسائل البريد الإلكتروني المرسلة عند الموافقة أو رفض طلبات الترقية
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              الإعدادات العامة
            </CardTitle>
            <CardDescription>معلومات المرسل وتذييل البريد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_name">اسم المرسل</Label>
                <Input
                  id="sender_name"
                  value={settings.sender_name}
                  onChange={(e) =>
                    setSettings({ ...settings, sender_name: e.target.value })
                  }
                  placeholder="Podgram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_email">البريد الإلكتروني للمرسل</Label>
                <Input
                  id="sender_email"
                  type="email"
                  value={settings.sender_email}
                  onChange={(e) =>
                    setSettings({ ...settings, sender_email: e.target.value })
                  }
                  placeholder="onboarding@resend.dev"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_text">نص التذييل</Label>
              <Input
                id="footer_text"
                value={settings.footer_text}
                onChange={(e) =>
                  setSettings({ ...settings, footer_text: e.target.value })
                }
                placeholder="شكراً لاختيارك Podgram"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Approval Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">رسالة الموافقة</CardTitle>
            <CardDescription>محتوى البريد المرسل عند الموافقة على الترقية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approval_subject">عنوان البريد</Label>
              <Input
                id="approval_subject"
                value={settings.approval_subject}
                onChange={(e) =>
                  setSettings({ ...settings, approval_subject: e.target.value })
                }
                placeholder="تم الموافقة على طلب الترقية! ✓"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval_title">عنوان الرسالة</Label>
              <Input
                id="approval_title"
                value={settings.approval_title}
                onChange={(e) =>
                  setSettings({ ...settings, approval_title: e.target.value })
                }
                placeholder="مرحباً بك! 🎉"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval_message">محتوى الرسالة</Label>
              <Textarea
                id="approval_message"
                value={settings.approval_message}
                onChange={(e) =>
                  setSettings({ ...settings, approval_message: e.target.value })
                }
                rows={4}
                placeholder="يسعدنا إبلاغك بأنه تمت الموافقة على طلب ترقية عضويتك..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval_button_text">نص الزر</Label>
              <Input
                id="approval_button_text"
                value={settings.approval_button_text}
                onChange={(e) =>
                  setSettings({ ...settings, approval_button_text: e.target.value })
                }
                placeholder="زيارة المنصة"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Rejection Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">رسالة الرفض</CardTitle>
            <CardDescription>محتوى البريد المرسل عند رفض الترقية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_subject">عنوان البريد</Label>
              <Input
                id="rejection_subject"
                value={settings.rejection_subject}
                onChange={(e) =>
                  setSettings({ ...settings, rejection_subject: e.target.value })
                }
                placeholder="بخصوص طلب الترقية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection_title">عنوان الرسالة</Label>
              <Input
                id="rejection_title"
                value={settings.rejection_title}
                onChange={(e) =>
                  setSettings({ ...settings, rejection_title: e.target.value })
                }
                placeholder="مرحباً"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection_message">محتوى الرسالة</Label>
              <Textarea
                id="rejection_message"
                value={settings.rejection_message}
                onChange={(e) =>
                  setSettings({ ...settings, rejection_message: e.target.value })
                }
                rows={4}
                placeholder="نعتذر عن إبلاغك بأنه لم تتم الموافقة..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection_footer">نص ختامي</Label>
              <Textarea
                id="rejection_footer"
                value={settings.rejection_footer}
                onChange={(e) =>
                  setSettings({ ...settings, rejection_footer: e.target.value })
                }
                rows={2}
                placeholder="يمكنك التواصل معنا للحصول على مزيد من المعلومات..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-6">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardEmailSettings;