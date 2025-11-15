import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Send, TestTube } from "lucide-react";
import { getSession } from "@/lib/auth";
import { useEffect } from "react";

const TestNotifications = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("اختبار الإشعارات");
  const [message, setMessage] = useState("هذا إشعار تجريبي للتأكد من عمل النظام");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getSession().then(({ user }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    });
  }, [navigate]);

  const handleSendTestNotification = async () => {
    if (!userId) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setSending(true);

    try {
      // Send push notification via edge function
      const { data, error } = await supabase.functions.invoke(
        "send-push-notification",
        {
          body: {
            userId,
            title,
            body: message,
            url,
          },
        }
      );

      if (error) throw error;

      console.log("Push notification response:", data);
      
      if (data?.sent > 0) {
        toast.success(`تم إرسال ${data.sent} إشعار بنجاح! 🎉`);
      } else {
        toast.info("لا توجد اشتراكات نشطة لإرسال الإشعارات إليها");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("فشل إرسال الإشعار التجريبي");
    } finally {
      setSending(false);
    }
  };

  const handleCreateDatabaseNotification = async () => {
    if (!userId) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type: "system",
          listing_id: null,
          related_user_id: null,
        });

      if (error) throw error;

      toast.success("تم إنشاء إشعار في قاعدة البيانات بنجاح! 🎉");
    } catch (error) {
      console.error("Error creating database notification:", error);
      toast.error("فشل إنشاء الإشعار في قاعدة البيانات");
    } finally {
      setSending(false);
    }
  };

  const presetNotifications = [
    {
      title: "مزاد جديد!",
      message: "تم إضافة مزاد جديد على ساعة رولكس نادرة",
      url: "/auctions",
    },
    {
      title: "عرض سعر جديد",
      message: "تلقيت عرض سعر جديد على إعلانك",
      url: "/dashboard/listings",
    },
    {
      title: "رسالة جديدة",
      message: "لديك رسالة جديدة من أحد المشترين",
      url: "/messages",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-3 mr-4">
              <TestTube className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">اختبار الإشعارات</h1>
            </div>
          </header>

          <main className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* نموذج إرسال إشعار مخصص */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">إرسال إشعار تجريبي</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="mb-2 block">
                      عنوان الإشعار
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="أدخل عنوان الإشعار"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="mb-2 block">
                      نص الإشعار
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="أدخل نص الإشعار"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="url" className="mb-2 block">
                      رابط الإشعار (عند الضغط عليه)
                    </Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="/"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSendTestNotification}
                      disabled={sending || !title || !message}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 ml-2" />
                      {sending ? "جاري الإرسال..." : "إرسال Push Notification"}
                    </Button>

                    <Button
                      onClick={handleCreateDatabaseNotification}
                      disabled={sending || !title || !message}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Bell className="h-4 w-4 ml-2" />
                      {sending ? "جاري الإنشاء..." : "إنشاء إشعار في القاعدة"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* قوالب جاهزة */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">قوالب جاهزة</h2>
                <div className="space-y-3">
                  {presetNotifications.map((preset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">
                          {preset.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {preset.message}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTitle(preset.title);
                          setMessage(preset.message);
                          setUrl(preset.url);
                          toast.success("تم تطبيق القالب");
                        }}
                      >
                        استخدام
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* معلومات مفيدة */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  ℹ️ ملاحظات هامة
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      يجب تفعيل الإشعارات من صفحة الإعدادات أولاً لاستقبال Push
                      Notifications
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      زر "إرسال Push Notification" يرسل إشعار مباشر عبر المتصفح
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      زر "إنشاء إشعار في القاعدة" ينشئ إشعار في قاعدة البيانات
                      يظهر في قائمة الإشعارات
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      يمكنك تجربة الإشعارات حتى لو كان التطبيق مغلقاً (بشرط أن
                      يكون المتصفح مفتوحاً)
                    </span>
                  </li>
                </ul>
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

export default TestNotifications;
