import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Star, Zap } from "lucide-react";
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
  free: <Zap className="h-6 w-6" />,
  basic: <Star className="h-6 w-6" />,
  advanced: <Crown className="h-6 w-6" />,
  premium: <Crown className="h-6 w-6" />,
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
        // Auto-select first plan if none selected
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">اختر الباقة المناسبة لك</h3>
        <p className="text-sm text-muted-foreground">يمكنك تغيير الباقة لاحقاً من لوحة التحكم</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onPlanSelect(plan.id)}
            className={cn(
              "relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-300",
              "hover:shadow-lg hover:scale-[1.02]",
              selectedPlanId === plan.id
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

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedPlanId === plan.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {planIcons[plan.name_en] || <Star className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {plan.max_active_auctions === 1 ? "مزاد واحد نشط" : `${plan.auctions_per_day} مزاد/يوم`}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedPlanId === plan.id
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              )}>
                {selectedPlanId === plan.id && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price === 0 ? "مجاناً" : `${plan.price.toLocaleString("en-US")}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground">ر.س/شهرياً</span>
                )}
              </div>
              <p className="text-sm mt-1">
                <span className={cn(
                  "font-semibold",
                  plan.commission_rate === 0 ? "text-green-600" : "text-foreground"
                )}>
                  {plan.commission_rate === 0 
                    ? "بدون عمولة!" 
                    : `عمولة ${plan.commission_rate}% عند البيع`}
                </span>
              </p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
          <strong>ملاحظة:</strong> في حال التأخر عن دفع المستحقات خلال شهر، سيتم إيقاف العضوية إلى أن يتم سداد المستحقات
        </p>
      </div>
    </div>
  );
};

export default MerchantPlanSelector;
