import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn, signUp, getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Store } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import podgramLogo from "@/assets/podgram-logo.png";
import heroImage from "@/assets/hero-luxury.jpg";

const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم طويل جداً")
    .refine(
      (name) => /^[\u0600-\u06FF\s]+$/.test(name),
      "الاسم يجب أن يحتوي على أحرف عربية فقط"
    )
    .refine(
      (name) => name.split(/\s+/).filter(word => word.length > 0).length >= 2,
      "يجب إدخال الاسم الكامل (اسمين على الأقل)"
    ),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

interface AuthSettings {
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

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registerPassword, setRegisterPassword] = useState("");
  const [membershipType, setMembershipType] = useState<"merchant" | "consumer">("consumer");
  const [authSettings, setAuthSettings] = useState<AuthSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { session } = await getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();

    // Fetch auth settings
    const fetchAuthSettings = async () => {
      const { data } = await supabase
        .from("auth_settings")
        .select("*")
        .eq("is_active", true)
        .single();
      
      if (data) {
        setAuthSettings(data);
      }
    };
    fetchAuthSettings();

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCodeFromUrl(refCode);
    }
  }, [navigate]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength === 0) return "";
    if (strength <= 2) return "ضعيفة";
    if (strength === 3) return "متوسطة";
    if (strength === 4) return "قوية";
    return "قوية جداً";
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 2) return "bg-red-500";
    if (strength === 3) return "bg-yellow-500";
    if (strength === 4) return "bg-green-500";
    return "bg-green-600";
  };

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
    const referralCode = formData.get("referral-code") as string;

    try {
      const validation = registerSchema.parse({ fullName, email, password, confirmPassword, referralCode });

      const { error } = await signUp(
        validation.email, 
        validation.password, 
        validation.fullName,
        validation.referralCode,
        membershipType
      );

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("البريد الإلكتروني مسجل بالفعل");
        } else {
          toast.error("خطأ في إنشاء الحساب", { description: error.message });
        }
      } else {
        // Check if email confirmation is enabled
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Email confirmation required - redirect to verify page
          const message = membershipType === "merchant" 
            ? "تحقق من بريدك الإلكتروني لتفعيل حسابك. سيتم مراجعة طلبك من قبل الإدارة"
            : "تحقق من بريدك الإلكتروني لتفعيل حسابك";
            
          toast.success("تم إنشاء الحساب!", {
            description: message
          });
          navigate("/verify-email", { state: { email: validation.email } });
        } else {
          // Auto-confirmed - show different messages based on membership type
          if (membershipType === "merchant") {
            toast.success("تم إنشاء الحساب بنجاح!", {
              description: "سيتم مراجعة طلبك من قبل الإدارة قريباً"
            });
          } else {
            toast.success("تم إنشاء الحساب بنجاح!", {
              description: "يمكنك الآن البدء في المزايدة على المنتجات"
            });
          }
          navigate("/dashboard");
        }
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

          <Card className="p-8 shadow-elegant border-2" dir="rtl">
            <Tabs defaultValue="login" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                <TabsTrigger value="register" className="text-base">
                  {authSettings?.register_tab_text || "حساب جديد"}
                </TabsTrigger>
                <TabsTrigger value="login" className="text-base">
                  {authSettings?.login_tab_text || "تسجيل الدخول"}
                </TabsTrigger>
              </TabsList>

              {/* تسجيل الدخول */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>البريد الإلكتروني</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                    dir="ltr"
                    className="transition-smooth text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>كلمة المرور</span>
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
                      className="transition-smooth pl-10 text-left"
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
                  className="w-full h-12 text-base font-semibold transition-smooth flex items-center justify-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(219, 78%, 56%), hsl(219, 78%, 66%))',
                    color: 'white'
                  }}
                  disabled={isLoading}
                >
                  <ArrowRight className="h-5 w-5" />
                  <span>{isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</span>
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
                    <span>{authSettings?.full_name_label || "الاسم الكامل"}</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={authSettings?.full_name_placeholder || "أحمد محمد"}
                    required
                    disabled={isLoading}
                    dir="rtl"
                    className="transition-smooth text-right"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {authSettings?.full_name_hint || "يجب إدخال اسمين عربيين على الأقل (بدون أرقام أو رموز)"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {authSettings?.membership_section_title || "نوع العضوية"}
                  </Label>
                  <RadioGroup 
                    value={membershipType} 
                    onValueChange={(value) => setMembershipType(value as "merchant" | "consumer")}
                    className="gap-3"
                  >
                    <div 
                      className="flex items-center space-x-2 space-x-reverse border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setMembershipType("consumer")}
                    >
                      <RadioGroupItem value="consumer" id="consumer" />
                      <Label htmlFor="consumer" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="font-medium">{authSettings?.consumer_title || "مستهلك"}</div>
                            <div className="text-xs text-muted-foreground">
                              {authSettings?.consumer_description || "يمكنك المزايدة على المنتجات فوراً دون الحاجة لموافقة الإدارة"}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div 
                      className="flex items-center space-x-2 space-x-reverse border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setMembershipType("merchant")}
                    >
                      <RadioGroupItem value="merchant" id="merchant" />
                      <Label htmlFor="merchant" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <Store className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="font-medium">{authSettings?.merchant_title || "تاجر"}</div>
                            <div className="text-xs text-muted-foreground">
                              {authSettings?.merchant_description || "يمكنك طرح المنتجات والمزادات بعد موافقة الإدارة"}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{authSettings?.email_label || "البريد الإلكتروني"}</span>
                  </Label>
                  <Input
                    id="register-email"
                    name="register-email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                    dir="ltr"
                    className="transition-smooth text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>{authSettings?.password_label || "كلمة المرور"}</span>
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
                      className="transition-smooth pl-10 text-left"
                      value={registerPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRegisterPassword(value);
                        setPasswordStrength(calculatePasswordStrength(value));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {registerPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all ${
                              level <= passwordStrength
                                ? getPasswordStrengthColor(passwordStrength)
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-right" style={{
                        color: passwordStrength <= 2 ? 'hsl(0, 84%, 60%)' : 
                               passwordStrength === 3 ? 'hsl(48, 96%, 53%)' : 
                               'hsl(142, 71%, 45%)'
                      }}>
                        قوة كلمة المرور: {getPasswordStrengthLabel(passwordStrength)}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground text-right">
                    {authSettings?.password_hint || "استخدم 8+ أحرف مع مزيج من الأحرف الكبيرة والصغيرة، أرقام ورموز"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>{authSettings?.confirm_password_label || "تأكيد كلمة المرور"}</span>
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
                      className="transition-smooth pl-10 text-left"
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

                <div className="space-y-2">
                  <Label htmlFor="referral-code" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{authSettings?.referral_code_label || "كود الإحالة (اختياري)"}</span>
                  </Label>
                  <Input
                    id="referral-code"
                    name="referral-code"
                    type="text"
                    placeholder="أدخل كود الإحالة إن وجد"
                    defaultValue={referralCodeFromUrl}
                    disabled={isLoading}
                    dir="ltr"
                    className="transition-smooth text-left uppercase"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    إذا كان لديك كود إحالة من صديق، أدخله هنا
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold transition-smooth flex items-center justify-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(159, 58%, 57%), hsl(159, 58%, 67%))',
                    color: 'white'
                  }}
                  disabled={isLoading}
                >
                  <ArrowRight className="h-5 w-5" />
                  <span>{isLoading ? "جاري إنشاء الحساب..." : (authSettings?.register_button_text || "إنشاء حساب")}</span>
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
