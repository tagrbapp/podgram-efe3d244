import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, Bell } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import { z } from "zod";
import { useWebPush } from "@/hooks/useWebPush";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email("البريد الإلكتروني غير صحيح"),
});

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Email change states
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  
  // Web Push states
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = useWebPush();

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadUserProfile(user);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadUserProfile(user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (user: User) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setFullName(profileData.full_name || "");
      setPhone(profileData.phone || "");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("فشل في حفظ التغييرات");
      setSaving(false);
      return;
    }

    toast.success("تم حفظ التغييرات بنجاح");
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    try {
      const validated = passwordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setChangingPassword(true);

      // Re-authenticate user first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: validated.currentPassword,
      });

      if (signInError) {
        toast.error("كلمة المرور الحالية غير صحيحة");
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: validated.newPassword,
      });

      if (updateError) {
        toast.error("فشل في تغيير كلمة المرور");
        setChangingPassword(false);
        return;
      }

      toast.success("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user) return;

    try {
      const validated = emailSchema.parse({ newEmail });

      setChangingEmail(true);

      const { error } = await supabase.auth.updateUser({
        email: validated.newEmail,
      });

      if (error) {
        toast.error("فشل في تحديث البريد الإلكتروني");
        setChangingEmail(false);
        return;
      }

      toast.success("تم إرسال رابط التأكيد إلى البريد الإلكتروني الجديد");
      setNewEmail("");
      setChangingEmail(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      setChangingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold mr-4">الإعدادات</h1>
          </header>

          <main className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* معلومات الحساب الأساسية */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  معلومات الحساب الأساسية
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      البريد الإلكتروني الحالي
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fullName" className="mb-2 block">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </Card>

              <Separator />

              {/* تغيير البريد الإلكتروني */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  تغيير البريد الإلكتروني
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newEmail" className="mb-2 block">
                      البريد الإلكتروني الجديد
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="البريد الإلكتروني الجديد"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      سيتم إرسال رابط تأكيد إلى البريد الجديد
                    </p>
                  </div>

                  <Button
                    onClick={handleEmailChange}
                    disabled={changingEmail || !newEmail}
                    className="w-full"
                    variant="secondary"
                  >
                    {changingEmail ? "جاري التحديث..." : "تحديث البريد الإلكتروني"}
                  </Button>
                </div>
              </Card>

              <Separator />

              {/* تغيير كلمة المرور */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  تغيير كلمة المرور
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="mb-2 block">
                      كلمة المرور الحالية
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="mb-2 block">
                      كلمة المرور الجديدة
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block">
                      تأكيد كلمة المرور
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full"
                    variant="secondary"
                  >
                    {changingPassword ? "جاري التغيير..." : "تغيير كلمة المرور"}
                  </Button>
                </div>
              </Card>

              <Separator />

              {/* إشعارات المتصفح */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  إشعارات المتصفح
                </h2>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    احصل على إشعارات فورية حتى عندما يكون التطبيق مغلقاً
                  </p>

                  {!isSupported ? (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      المتصفح لا يدعم إشعارات المتصفح
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {isSubscribed ? "الإشعارات مفعلة" : "تفعيل الإشعارات"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSubscribed 
                            ? "ستتلقى إشعارات فورية على المتصفح"
                            : "انقر للسماح بإرسال الإشعارات"}
                        </p>
                      </div>
                      <Switch
                        checked={isSubscribed}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            subscribe();
                          } else {
                            unsubscribe();
                          }
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isSubscribed && (
                    <div className="rounded-md bg-primary/10 p-3 text-sm">
                      <p className="font-medium text-primary mb-1">✓ الإشعارات نشطة</p>
                      <p className="text-xs text-muted-foreground">
                        ستتلقى إشعارات عن المزادات الجديدة، العروض، والرسائل
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Separator />

              {/* معلومات إضافية */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">معلومات الحساب</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>تاريخ الإنشاء: {new Date(user?.created_at || "").toLocaleDateString("ar-SA")}</p>
                  <p className="font-mono text-xs">معرف المستخدم: {user?.id}</p>
                </div>
              </Card>
            </div>
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
