import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { updatePassword, getSession } from "@/lib/auth";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import podgramLogo from "@/assets/podgram-logo.png";

const passwordSchema = z.object({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { session } = await getSession();
      if (session) {
        setHasSession(true);
      } else {
        toast.error("رابط غير صالح أو منتهي الصلاحية");
        navigate("/forgot-password");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    try {
      const validation = passwordSchema.parse({ password, confirmPassword });
      
      const { error } = await updatePassword(validation.password);

      if (error) {
        toast.error("حدث خطأ في تحديث كلمة المرور", { 
          description: error.message 
        });
      } else {
        toast.success("تم تحديث كلمة المرور بنجاح!", {
          description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة"
        });
        navigate("/auth");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSession) {
    return null;
  }

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
          <h1 className="text-3xl font-bold mb-2">تعيين كلمة مرور جديدة</h1>
          <p className="text-muted-foreground">
            أدخل كلمة المرور الجديدة لحسابك
          </p>
        </div>

        <Card className="p-8 shadow-elegant border-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                كلمة المرور الجديدة
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="transition-smooth pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                يجب أن تحتوي على 6 أحرف على الأقل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                تأكيد كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••"
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="transition-smooth pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              {isLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>

            <div className="text-center pt-4">
              <Link 
                to="/auth" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;