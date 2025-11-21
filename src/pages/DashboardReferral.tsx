import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, UserPlus, Gift } from "lucide-react";

const DashboardReferral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState({ total: 0, points: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await loadReferralData(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const loadReferralData = async (userId: string) => {
    try {
      // Get user's referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setReferralCode(profile.referral_code || '');

      // Get referral statistics
      const { data: referrals, error: referralsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', userId);

      if (referralsError) throw referralsError;

      // Calculate points earned from referrals (10 points per referral)
      const totalReferrals = referrals?.length || 0;
      setReferralStats({
        total: totalReferrals,
        points: totalReferrals * 10
      });

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error("خطأ في تحميل بيانات الإحالة");
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  const copyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(getReferralUrl());
      toast.success("تم نسخ الرابط!");
    } catch (error) {
      toast.error("فشل نسخ الرابط");
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("تم نسخ الكود!");
    } catch (error) {
      toast.error("فشل نسخ الكود");
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'انضم إلى Podgram',
      text: `استخدم كودي للتسجيل واحصل على منتجات فاخرة! الكود: ${referralCode}`,
      url: getReferralUrl()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyReferralUrl();
        toast.success("تم نسخ رابط الدعوة!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <UserPlus className="h-8 w-8 text-primary" />
                دعوة الأصدقاء
              </h1>
              <p className="text-muted-foreground">
                ادع أصدقاءك واحصل على 10 نقاط لكل صديق يسجل باستخدام كودك
              </p>
            </div>

            {/* إحصائيات الإحالة */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    عدد الدعوات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">
                    {referralStats.total}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    إجمالي الأصدقاء المدعوين
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    النقاط المكتسبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">
                    {referralStats.points}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    من دعوات الأصدقاء
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* كود الإحالة */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>كود الإحالة الخاص بك</CardTitle>
                <CardDescription>
                  شارك هذا الكود مع أصدقائك للحصول على النقاط
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>الكود</Label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="font-mono text-lg font-bold text-center bg-muted"
                      dir="ltr"
                    />
                    <Button onClick={copyReferralCode} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رابط الدعوة</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getReferralUrl()}
                      readOnly
                      className="text-sm bg-muted"
                      dir="ltr"
                    />
                    <Button onClick={copyReferralUrl} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={shareReferral} 
                    className="w-full"
                    size="lg"
                  >
                    <Share2 className="h-5 w-5 ml-2" />
                    مشاركة رابط الدعوة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* كيف يعمل */}
            <Card>
              <CardHeader>
                <CardTitle>كيف يعمل نظام الدعوة؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">شارك الكود أو الرابط</p>
                      <p className="text-sm text-muted-foreground">
                        أرسل كود الإحالة أو الرابط لأصدقائك عبر وسائل التواصل الاجتماعي أو الرسائل
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">يسجل صديقك حساباً جديداً</p>
                      <p className="text-sm text-muted-foreground">
                        عند التسجيل، يقوم صديقك بإدخال كودك في خانة كود الإحالة الاختيارية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">احصل على 10 نقاط فوراً</p>
                      <p className="text-sm text-muted-foreground">
                        بمجرد اكتمال التسجيل، تحصل تلقائياً على 10 نقاط
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardReferral;