import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth";
import { ArrowRight, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
import podgramLogo from "@/assets/podgram-logo.png";

const emailSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const validation = emailSchema.parse({ email });
      
      const { error } = await resetPassword(validation.email);

      if (error) {
        toast.error("حدث خطأ في إرسال رابط إعادة التعيين", { 
          description: error.message 
        });
      } else {
        setEmailSent(true);
        toast.success("تم إرسال رابط إعادة التعيين!", {
          description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold mb-2">استعادة كلمة المرور</h1>
          <p className="text-muted-foreground">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </p>
        </div>

        <Card className="p-8 shadow-elegant border-2">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="transition-smooth"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold transition-smooth"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(219, 78%, 56%), hsl(219, 78%, 66%))',
                  color: 'white'
                }}
                disabled={isLoading}
              >
                {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>

              <div className="text-center pt-4 space-y-2">
                <Link 
                  to="/auth" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">تم إرسال البريد الإلكتروني</h3>
              <p className="text-muted-foreground">
                تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور
              </p>
              <div className="pt-4">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    العودة لتسجيل الدخول
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;