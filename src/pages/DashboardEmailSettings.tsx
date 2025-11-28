import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowRight, Mail, Save, Eye, Palette, Sparkles, Crown, X } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  template_type: 'approval' | 'rejection';
  primary_color: string;
  background_color: string;
  text_color: string;
  header_style: string;
  show_features_box: boolean;
  show_footer_logo: boolean;
  button_style: string;
  is_default: boolean;
}

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
  approval_template_id: string | null;
  rejection_template_id: string | null;
}

const DashboardEmailSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [approvalTemplates, setApprovalTemplates] = useState<EmailTemplate[]>([]);
  const [rejectionTemplates, setRejectionTemplates] = useState<EmailTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    checkAuth();
    fetchSettings();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false });

      if (error) throw error;

      const approval = (data?.filter(t => t.template_type === 'approval') || []) as EmailTemplate[];
      const rejection = (data?.filter(t => t.template_type === 'rejection') || []) as EmailTemplate[];
      
      setApprovalTemplates(approval);
      setRejectionTemplates(rejection);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      toast.error("فشل تحميل القوالب");
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
          approval_template_id: settings.approval_template_id,
          rejection_template_id: settings.rejection_template_id,
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

  const getTemplateIcon = (style: string) => {
    switch (style) {
      case 'modern':
        return <Sparkles className="h-4 w-4" />;
      case 'luxury':
        return <Crown className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
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
        {/* Template Selection for Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Palette className="h-5 w-5" />
              قالب بريد الموافقة
            </CardTitle>
            <CardDescription>اختر القالب المناسب لرسائل الموافقة</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.approval_template_id || ''}
              onValueChange={(value) => setSettings({ ...settings, approval_template_id: value })}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {approvalTemplates.map((template) => (
                  <div key={template.id} className="relative">
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        settings.approval_template_id === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-border hover:border-green-300'
                      }`}
                      onClick={() => setSettings({ ...settings, approval_template_id: template.id })}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <RadioGroupItem value={template.id} id={`approval-${template.id}`} />
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                        )}
                      </div>
                      <div
                        className="w-full h-24 rounded mb-3"
                        style={{ backgroundColor: template.primary_color, opacity: 0.1 }}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        {getTemplateIcon(template.header_style)}
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        معاينة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Separator />

        {/* Template Selection for Rejection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Palette className="h-5 w-5" />
              قالب بريد الرفض
            </CardTitle>
            <CardDescription>اختر القالب المناسب لرسائل الرفض</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.rejection_template_id || ''}
              onValueChange={(value) => setSettings({ ...settings, rejection_template_id: value })}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rejectionTemplates.map((template) => (
                  <div key={template.id} className="relative">
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        settings.rejection_template_id === template.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-border hover:border-red-300'
                      }`}
                      onClick={() => setSettings({ ...settings, rejection_template_id: template.id })}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <RadioGroupItem value={template.id} id={`rejection-${template.id}`} />
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                        )}
                      </div>
                      <div
                        className="w-full h-24 rounded mb-3"
                        style={{ backgroundColor: template.primary_color, opacity: 0.1 }}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        {getTemplateIcon(template.header_style)}
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        معاينة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Separator />

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

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة القالب: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="mt-4">
              <div 
                className="border rounded-lg p-8 bg-gradient-to-br"
                style={{ 
                  background: `linear-gradient(135deg, ${previewTemplate.primary_color}10, ${previewTemplate.primary_color}05)` 
                }}
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
                  <div 
                    className="p-8 text-center"
                    style={{ 
                      background: previewTemplate.primary_color,
                      padding: previewTemplate.header_style === 'luxury' ? '40px' : '20px'
                    }}
                  >
                    <h1 
                      className="text-white font-bold"
                      style={{ 
                        fontSize: previewTemplate.header_style === 'modern' ? '28px' : '24px' 
                      }}
                    >
                      {previewTemplate.template_type === 'approval' 
                        ? settings?.approval_title || 'مرحباً بك! 🎉'
                        : settings?.rejection_title || 'مرحباً'
                      }
                    </h1>
                  </div>
                  
                  <div className="p-8">
                    <p className="text-gray-700 text-base leading-relaxed mb-6">
                      {previewTemplate.template_type === 'approval' 
                        ? settings?.approval_message || 'يسعدنا إبلاغك بأنه تمت الموافقة على طلب ترقية عضويتك.'
                        : settings?.rejection_message || 'نعتذر عن إبلاغك بأنه لم تتم الموافقة على طلب ترقية عضويتك.'
                      }
                    </p>
                    
                    {previewTemplate.template_type === 'approval' && previewTemplate.show_features_box && (
                      <div 
                        className="bg-gray-50 p-6 rounded-lg mb-6"
                        style={{ borderRight: `4px solid ${previewTemplate.primary_color}` }}
                      >
                        <h2 className="text-gray-900 font-semibold text-lg mb-4">المزايا الجديدة:</h2>
                        <ul className="text-gray-600 space-y-2 list-disc list-inside">
                          <li>إمكانية إضافة عدد غير محدود من الإعلانات</li>
                          <li>إنشاء مزادات خاصة</li>
                          <li>أولوية في الظهور</li>
                          <li>إحصائيات متقدمة</li>
                        </ul>
                      </div>
                    )}
                    
                    <div className="text-center my-8">
                      <button
                        className="font-bold px-8 py-3 rounded-lg transition-all"
                        style={{
                          background: previewTemplate.button_style === 'outline' ? 'transparent' : previewTemplate.primary_color,
                          border: previewTemplate.button_style === 'outline' ? `2px solid ${previewTemplate.primary_color}` : 'none',
                          color: previewTemplate.button_style === 'outline' ? previewTemplate.primary_color : 'white'
                        }}
                      >
                        {previewTemplate.template_type === 'approval' 
                          ? settings?.approval_button_text || 'زيارة المنصة'
                          : 'التواصل معنا'
                        }
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 text-center border-t">
                    <p className="text-sm text-gray-600">
                      {settings?.footer_text || 'شكراً لاختيارك Podgram'}<br/>
                      <strong>{settings?.sender_name || 'Podgram'}</strong>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setPreviewTemplate(null)} variant="outline">
                  <X className="h-4 w-4 ml-2" />
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardEmailSettings;