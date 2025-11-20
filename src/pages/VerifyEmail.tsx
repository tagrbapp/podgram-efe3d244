import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/lib/auth";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import podgramLogo from "@/assets/podgram-logo.png";

const VerifyEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const location = useLocation();
  const email = location.state?.email || "";

  const handleResend = async () => {
    if (!email) {
      toast.error("البريد الإلكتروني غير متوفر");
      return;
    }

    setIsLoading(true);

    const { error } = await resendVerificationEmail(email);

    if (error) {
      toast.error("حدث خطأ في إعادة الإرسال", {
        description: error.message,
      });
    } else {
      toast.success("تم إعادة إرسال رابط التأكيد!", {
        description: "تحقق من بريدك الإلكتروني",
      });
      
      // Start cooldown (60 seconds)
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 hover-scale">
            <img src={podgramLogo} alt="Podgram" className="h-12 w-12" />
            <span className="text-2xl font-bold" style={{ color: 'hsl(var(--qultura-blue))' }}>
              Podgram
            </span>
          </Link>
        </div>

        <Card className="p-8 shadow-elegant border-2">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-qultura-blue/20 to-qultura-green/20 flex items-center justify-center">
              <Mail className="h-10 w-10" style={{ color: 'hsl(var(--qultura-blue))' }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">تأكيد البريد الإلكتروني</h1>
              <p className="text-muted-foreground">
                تم إرسال رابط التأكيد إلى بريدك الإلكتروني
              </p>
            </div>

            {email && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium" dir="ltr">{email}</p>
              </div>
            )}

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <p className="text-right">تحقق من صندوق الوارد في بريدك الإلكتروني</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <p className="text-right">انقر على الرابط في البريد لتفعيل حسابك</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <p className="text-right">تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تجد البريد</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleResend}
                disabled={isLoading || cooldown > 0}
                variant="outline"
                className="w-full h-12 text-base"
              >
                {isLoading ? (
                  "جاري الإرسال..."
                ) : cooldown > 0 ? (
                  `أعد المحاولة بعد ${cooldown} ثانية`
                ) : (
                  <>
                    <RefreshCw className="ml-2 h-5 w-5" />
                    إعادة إرسال رابط التأكيد
                  </>
                )}
              </Button>

              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                هل تحتاج مساعدة؟{" "}
                <Link to="/support" className="text-primary hover:underline">
                  تواصل معنا
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;