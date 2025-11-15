import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn, signUp, getSession } from "@/lib/auth";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
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

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("خطأ في تسجيل الدخول", {
        description: error.message === "Invalid login credentials" 
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message,
      });
    } else {
      toast.success("تم تسجيل الدخول بنجاح!");
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("name") as string;
    const email = formData.get("register-email") as string;
    const password = formData.get("register-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error("خطأ في إنشاء الحساب", {
        description: error.message === "User already registered"
          ? "البريد الإلكتروني مسجل بالفعل"
          : error.message,
      });
    } else {
      toast.success("تم إنشاء الحساب بنجاح!", {
        description: "جاري تحويلك إلى لوحة التحكم..."
      });
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-2xl font-bold text-primary-foreground">إ</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              إعلاناتي
            </span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">مرحباً بك</h1>
          <p className="text-muted-foreground mt-2">سجل دخولك أو أنشئ حساب جديد</p>
        </div>

        <Card className="p-6 shadow-elegant">
          <Tabs defaultValue="login" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="example@email.com"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password"
                    className="text-right"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input 
                    id="name" 
                    name="name"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">البريد الإلكتروني</Label>
                  <Input 
                    id="register-email" 
                    name="register-email"
                    type="email"
                    placeholder="example@email.com"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">كلمة المرور</Label>
                  <Input 
                    id="register-password" 
                    name="register-password"
                    type="password"
                    placeholder="6 أحرف على الأقل"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input 
                    id="confirm-password" 
                    name="confirm-password"
                    type="password"
                    className="text-right"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-secondary hover:opacity-90 transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري التحميل..." : "إنشاء حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          بالتسجيل، أنت توافق على{" "}
          <a href="#" className="text-primary hover:underline">شروط الخدمة</a>
          {" "}و{" "}
          <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
