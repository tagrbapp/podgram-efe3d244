import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, TrendingUp } from "lucide-react";
import { convertArabicToEnglishNumbers } from "@/lib/utils";

interface AutoBidSettingsProps {
  auctionId: string;
  minBidAmount: number;
}

const AutoBidSettings = ({ auctionId, minBidAmount }: AutoBidSettingsProps) => {
  const [isActive, setIsActive] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoBidId, setAutoBidId] = useState<string | null>(null);

  useEffect(() => {
    fetchAutoBidSettings();
  }, [auctionId]);

  const fetchAutoBidSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('auto_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setAutoBidId(data.id);
      setIsActive(data.is_active);
      setMaxBidAmount(data.max_bid_amount.toString());
    }
  };

  const handleToggle = async (checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    if (!checked && autoBidId) {
      // Deactivate auto bid
      const { error } = await supabase
        .from('auto_bids')
        .update({ is_active: false })
        .eq('id', autoBidId);

      if (error) {
        toast.error("فشل إيقاف المزايدة التلقائية");
        return;
      }

      setIsActive(false);
      toast.success("تم إيقاف المزايدة التلقائية");
    } else if (checked) {
      setIsActive(true);
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    const amount = parseFloat(maxBidAmount);
    if (isNaN(amount) || amount < minBidAmount) {
      toast.error(`الحد الأقصى يجب أن يكون ${minBidAmount.toLocaleString("en-US")} ريال على الأقل`);
      return;
    }

    setIsLoading(true);

    try {
      if (autoBidId) {
        // Update existing auto bid
        const { error } = await supabase
          .from('auto_bids')
          .update({
            max_bid_amount: amount,
            is_active: true
          })
          .eq('id', autoBidId);

        if (error) throw error;
      } else {
        // Create new auto bid
        const { data, error } = await supabase
          .from('auto_bids')
          .insert({
            auction_id: auctionId,
            user_id: user.id,
            max_bid_amount: amount,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        setAutoBidId(data.id);
      }

      setIsActive(true);
      toast.success("تم حفظ إعدادات المزايدة التلقائية! ⚡");
    } catch (error) {
      console.error("Error saving auto bid:", error);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">المزايدة التلقائية</h3>
              <p className="text-sm text-muted-foreground">
                زايد تلقائياً حتى حدك الأقصى
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {isActive && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                الحد الأقصى للمزايدة (ريال)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={maxBidAmount}
                onChange={(e) => setMaxBidAmount(convertArabicToEnglishNumbers(e.target.value))}
                placeholder={`مثال: ${(minBidAmount * 2).toLocaleString("en-US")}`}
                className="text-lg font-bold"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                الحد الأدنى: {minBidAmount.toLocaleString("en-US")} ريال
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">كيف تعمل المزايدة التلقائية؟</p>
              <ul className="space-y-1 text-xs">
                <li>• النظام سيزايد تلقائياً عندما يتجاوز أحدهم عرضك</li>
                <li>• الزيادات التلقائية تتم بمقدار الحد الأدنى للزيادة</li>
                <li>• تتوقف المزايدة عند وصول الحد الأقصى الذي حددته</li>
              </ul>
            </div>

            <Button
              onClick={handleSave}
              disabled={isLoading || !maxBidAmount}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <TrendingUp className="h-4 w-4 ml-2" />
              {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AutoBidSettings;