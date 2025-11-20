import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn, signUp, getSession } from "@/lib/auth";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import podgramLogo from "@/assets/podgram-logo.png";
import heroImage from "@/assets/hero-luxury.jpg";

const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(50, "الاسم طويل جداً"),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { session } = await getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const validation = loginSchema.parse({ email, password });
      
      const { error } = await signIn(validation.email, validation.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        } else {
          toast.error("خطأ في تسجيل الدخول", { description: error.message });
        }
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("name") as string;
    const email = formData.get("register-email") as string;
    const password = formData.get("register-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    try {
      const validation = registerSchema.parse({ fullName, email, password, confirmPassword });

      const { error } = await signUp(validation.email, validation.password, validation.fullName);

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("البريد الإلكتروني مسجل بالفعل");
        } else {
          toast.error("خطأ في إنشاء الحساب", { description: error.message });
        }
      } else {
        toast.success("تم إنشاء الحساب بنجاح!", {
          description: "جاري تحويلك إلى لوحة التحكم..."
        });
        navigate("/dashboard");
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
    <div className="min-h-screen flex">
      {/* الجانب الأيسر - صورة الخلفية */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Luxury Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-qultura-blue/90 via-qultura-green/80 to-qultura-blue/90" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <img src={podgramLogo} alt="Podgram" className="h-20 w-20 mb-6" />
          <h2 className="text-4xl font-bold mb-4">Podgram</h2>
          <p className="text-xl mb-2">أول منصة فاخرة في المنطقة</p>
          <p className="text-white/90 max-w-md">
            اكتشف عالماً من المنتجات الفاخرة والعروض الحصرية
          </p>
        </div>
      </div>

      {/* الجانب الأيمن - نموذج المصادقة */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 hover-scale">
              <img src={podgramLogo} alt="Podgram" className="h-12 w-12" />
              <span className="text-2xl font-bold" style={{ color: 'hsl(var(--qultura-blue))' }}>
                Podgram
              </span>
            </Link>
          </div>

          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">مرحباً بك</h1>
            <p className="text-muted-foreground">سجل دخولك أو أنشئ حساب جديد للبدء</p>
          </div>

          <Card className="p-8 shadow-elegant border-2">
            <Tabs defaultValue="login" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                <TabsTrigger value="login" className="text-base">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register" className="text-base">حساب جديد</TabsTrigger>
              </TabsList>

              {/* تسجيل الدخول */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    كلمة المرور
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
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>

                <div className="text-center pt-4">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <div className="text-center pt-6">
                  <Link 
                    to="/" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    العودة للرئيسية
                  </Link>
                </div>
              </form>
              </TabsContent>

              {/* إنشاء حساب */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="أحمد محمد"
                    required
                    disabled={isLoading}
                    className="transition-smooth"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="register-email"
                    name="register-email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                    dir="ltr"
                    className="transition-smooth"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      name="register-password"
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
                    background: 'linear-gradient(135deg, hsl(159, 58%, 57%), hsl(159, 58%, 67%))',
                    color: 'white'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>

                <div className="text-center pt-6">
                  <Link 
                    to="/" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    العودة للرئيسية
                  </Link>
                </div>
              </form>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              بالتسجيل، أنت توافق على <Link to="/terms" className="underline">شروط الاستخدام</Link> و<Link to="/privacy" className="underline">سياسة الخصوصية</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
