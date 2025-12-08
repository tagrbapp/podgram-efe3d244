import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Crown, Star, Zap, Diamond, Check, AlertTriangle, 
  CreditCard, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight,
  Clock, DollarSign, Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MerchantPlan {
  id: string;
  name: string;
  name_en: string;
  price: number;
  auctions_per_day: number;
  max_active_auctions: number | null;
  commission_rate: number;
  features: string[];
  is_popular: boolean;
  display_order: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  next_payment_date: string | null;
  last_payment_date: string | null;
  suspended_at: string | null;
  plan: MerchantPlan;
}

interface Commission {
  id: string;
  auction_id: string | null;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  basic: <Star className="h-6 w-6" />,
  advanced: <Crown className="h-6 w-6" />,
  premium: <Diamond className="h-6 w-6" />,
};

const planColors: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  basic: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  advanced: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  premium: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
};

const DashboardSubscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MerchantPlan | null>(null);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await Promise.all([
      fetchSubscription(user.id),
      fetchPlans(),
      fetchCommissions(user.id)
    ]);
    setLoading(false);
  };

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from("merchant_subscriptions")
      .select(`
        *,
        plan:merchant_plans(*)
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (data && !error) {
      const formattedData = {
        ...data,
        plan: {
          ...data.plan,
          features: Array.isArray(data.plan.features) 
            ? data.plan.features 
            : JSON.parse(data.plan.features as string || '[]')
        }
      };
      setSubscription(formattedData as Subscription);
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("merchant_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data && !error) {
      const formattedPlans = data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]')
      }));
      setPlans(formattedPlans);
    }
  };

  const fetchCommissions = async (userId: string) => {
    const { data, error } = await supabase
      .from("merchant_commissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setCommissions(data);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan || !userId) return;
    
    setChangingPlan(true);
    
    const { error } = await supabase
      .from("merchant_subscriptions")
      .update({
        plan_id: selectedPlan.id,
        updated_at: new Date().toISOString(),
        next_payment_date: selectedPlan.price > 0 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
      })
      .eq("user_id", userId);

    if (error) {
      toast.error("حدث خطأ في تغيير الباقة");
    } else {
      toast.success("تم تغيير الباقة بنجاح");
      await fetchSubscription(userId);
      setShowChangePlanDialog(false);
    }
    
    setChangingPlan(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">نشط</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">قيد الانتظار</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">موقف</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">مستحق</Badge>;
      case "paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">مدفوع</Badge>;
      case "overdue":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">متأخر</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPendingCommissions = commissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const totalPaidCommissions = commissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.commission_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <header className="h-16 border-b bg-card/95 backdrop-blur sticky top-0 z-10 flex items-center px-6">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold mr-4">إدارة الاشتراك</h1>
            </header>
            <main className="p-6">
              <Card className="text-center py-12">
                <CardContent>
                  <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">لا يوجد اشتراك</p>
                  <p className="text-muted-foreground mb-4">يبدو أنك لست مشتركاً في أي باقة تجارية</p>
                  <Button onClick={() => navigate("/auth")}>الانتقال للتسجيل</Button>
                </CardContent>
              </Card>
            </main>
          </div>
          <div className="order-1">
            <AppSidebar />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const currentPlanColors = planColors[subscription.plan.name_en] || planColors.free;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur sticky top-0 z-10 flex items-center px-6">
            <SidebarTrigger />
            <div className="mr-4">
              <h1 className="text-2xl font-bold">إدارة الاشتراك</h1>
              <p className="text-sm text-muted-foreground">عرض وإدارة باقتك والمستحقات</p>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {/* Current Plan Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl",
                        currentPlanColors.bg, currentPlanColors.text
                      )}>
                        {planIcons[subscription.plan.name_en] || <Star className="h-6 w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{subscription.plan.name}</CardTitle>
                        <CardDescription>باقتك الحالية</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">الاشتراك الشهري</p>
                      <p className="text-lg font-bold">
                        {subscription.plan.price === 0 ? "مجاني" : `${subscription.plan.price.toLocaleString("en-US")} ر.س`}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">نسبة العمولة</p>
                      <p className="text-lg font-bold">
                        {subscription.plan.commission_rate === 0 ? "0%" : `${subscription.plan.commission_rate}%`}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">المزادات اليومية</p>
                      <p className="text-lg font-bold">{subscription.plan.auctions_per_day}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">الحد الأقصى للنشطة</p>
                      <p className="text-lg font-bold">
                        {subscription.plan.max_active_auctions || "غير محدود"}
                      </p>
                    </div>
                  </div>

                  {subscription.next_payment_date && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          موعد الدفع القادم: {new Date(subscription.next_payment_date).toLocaleDateString("ar-SA")}
                        </p>
                        <p className="text-xs text-amber-600">المبلغ المستحق: {subscription.plan.price.toLocaleString("en-US")} ر.س</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">مميزات الباقة</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subscription.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    onClick={() => setShowChangePlanDialog(true)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    تغيير الباقة
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">عمولات مستحقة</p>
                        <p className="text-2xl font-bold">{totalPendingCommissions.toLocaleString("en-US")} ر.س</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <Receipt className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">عمولات مدفوعة</p>
                        <p className="text-2xl font-bold">{totalPaidCommissions.toLocaleString("en-US")} ر.س</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">تاريخ بداية الاشتراك</p>
                        <p className="text-lg font-bold">
                          {subscription.started_at 
                            ? new Date(subscription.started_at).toLocaleDateString("ar-SA")
                            : "غير محدد"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Commissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>سجل العمولات</CardTitle>
                <CardDescription>تفاصيل العمولات المستحقة والمدفوعة</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد عمولات حتى الآن</p>
                  </div>
                ) : (
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">قيمة البيع</TableHead>
                        <TableHead className="text-right">نسبة العمولة</TableHead>
                        <TableHead className="text-right">مبلغ العمولة</TableHead>
                        <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {new Date(commission.created_at).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>{commission.sale_amount.toLocaleString("en-US")} ر.س</TableCell>
                          <TableCell>{commission.commission_rate}%</TableCell>
                          <TableCell className="font-semibold">
                            {commission.commission_amount.toLocaleString("en-US")} ر.س
                          </TableCell>
                          <TableCell>
                            {commission.due_date 
                              ? new Date(commission.due_date).toLocaleDateString("ar-SA")
                              : "-"}
                          </TableCell>
                          <TableCell>{getCommissionStatusBadge(commission.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Warning Notice */}
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">ملاحظة هامة</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      في حال التأخر عن دفع المستحقات خلال شهر، سيتم إيقاف العضوية إلى أن يتم سداد المستحقات. 
                      يرجى التأكد من سداد المبالغ المستحقة في مواعيدها لتجنب انقطاع الخدمة.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        <div className="order-1">
          <AppSidebar />
        </div>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير الباقة</DialogTitle>
            <DialogDescription>
              اختر الباقة الجديدة المناسبة لاحتياجاتك
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {plans.map((plan) => {
              const colors = planColors[plan.name_en] || planColors.free;
              const isCurrentPlan = subscription?.plan.id === plan.id;
              const isSelected = selectedPlan?.id === plan.id;
              const isUpgrade = subscription && plan.price > subscription.plan.price;
              const isDowngrade = subscription && plan.price < subscription.plan.price;

              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan)}
                  className={cn(
                    "relative rounded-xl border-2 p-5 transition-all duration-200",
                    isCurrentPlan 
                      ? "opacity-60 cursor-not-allowed border-muted" 
                      : "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                    isSelected && !isCurrentPlan
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border hover:border-primary/50",
                    plan.is_popular && "ring-2 ring-primary/20"
                  )}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        الأفضل قيمة
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3">
                      <span className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full">
                        باقتك الحالية
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
                        {planIcons[plan.name_en] || <Star className="h-6 w-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-foreground">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {plan.max_active_auctions === 1 ? "مزاد واحد نشط" : `${plan.auctions_per_day} مزاد/يوم`}
                        </p>
                      </div>
                    </div>

                    {!isCurrentPlan && (
                      <div className="flex items-center gap-2">
                        {isUpgrade && (
                          <Badge className="bg-green-500/20 text-green-600 text-xs">
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                            ترقية
                          </Badge>
                        )}
                        {isDowngrade && (
                          <Badge className="bg-amber-500/20 text-amber-600 text-xs">
                            <ArrowDownRight className="h-3 w-3 ml-1" />
                            تخفيض
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price === 0 ? "مجاناً" : plan.price.toLocaleString("en-US")}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground">ر.س/شهرياً</span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-1 font-medium",
                      plan.commission_rate === 0 ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {plan.commission_rate === 0 
                        ? "بدون عمولة!" 
                        : `عمولة ${plan.commission_rate}% عند البيع`}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleChangePlan}
              disabled={!selectedPlan || selectedPlan.id === subscription?.plan.id || changingPlan}
            >
              {changingPlan ? "جاري التغيير..." : "تأكيد تغيير الباقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DashboardSubscription;