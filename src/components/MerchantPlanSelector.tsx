import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Star, Zap, Diamond } from "lucide-react";
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

interface MerchantPlanSelectorProps {
  selectedPlanId: string | null;
  onPlanSelect: (planId: string) => void;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  basic: <Star className="h-5 w-5" />,
  advanced: <Crown className="h-5 w-5" />,
  premium: <Diamond className="h-5 w-5" />,
};

const planColors: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  basic: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  advanced: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  premium: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
};

const MerchantPlanSelector = ({ selectedPlanId, onPlanSelect }: MerchantPlanSelectorProps) => {
  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        if (!selectedPlanId && formattedPlans.length > 0) {
          onPlanSelect(formattedPlans[0].id);
        }
      }
      setLoading(false);
    };

    fetchPlans();
  }, [selectedPlanId, onPlanSelect]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="text-center mb-3">
        <h3 className="text-base font-semibold text-foreground">اختر الباقة المناسبة لك</h3>
        <p className="text-xs text-muted-foreground">يمكنك تغيير الباقة لاحقاً من لوحة التحكم</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {plans.map((plan) => {
          const colors = planColors[plan.name_en] || planColors.free;
          const isSelected = selectedPlanId === plan.id;
          
          return (
            <div
              key={plan.id}
              onClick={() => onPlanSelect(plan.id)}
              className={cn(
                "relative rounded-xl border p-4 cursor-pointer transition-all duration-200",
                "hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-card",
                plan.is_popular && "ring-1 ring-primary/30"
              )}
            >
              {/* Popular Badge */}
              {plan.is_popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    الأفضل قيمة
                  </span>
                </div>
              )}

              {/* Header with Icon and Radio */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    isSelected ? "bg-primary text-primary-foreground" : colors.bg + " " + colors.text
                  )}>
                    {planIcons[plan.name_en] || <Star className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{plan.name}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {plan.max_active_auctions === 1 ? "مزاد واحد نشط" : `${plan.auctions_per_day} مزاد/يوم`}
                    </p>
                  </div>
                </div>
                
                {/* Radio Button */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/40 bg-background"
                )}>
                  {isSelected && (
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="mb-3 pb-3 border-b border-border/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {plan.price === 0 ? "مجاناً" : plan.price.toLocaleString("en-US")}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[10px] text-muted-foreground">ر.س/شهرياً</span>
                  )}
                </div>
                <p className={cn(
                  "text-xs mt-0.5 font-medium",
                  plan.commission_rate === 0 ? "text-green-600" : "text-muted-foreground"
                )}>
                  {plan.commission_rate === 0 
                    ? "بدون عمولة!" 
                    : `عمولة ${plan.commission_rate}% عند البيع`}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-1.5">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Notice */}
      <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-[11px] text-amber-800 dark:text-amber-200 text-center leading-relaxed">
          <strong>ملاحظة:</strong> في حال التأخر عن دفع المستحقات خلال شهر، سيتم إيقاف العضوية إلى أن يتم سداد المستحقات
        </p>
      </div>
    </div>
  );
};

export default MerchantPlanSelector;
