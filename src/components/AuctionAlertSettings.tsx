import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Clock, TrendingDown, AlertCircle } from "lucide-react";
import { convertArabicToEnglishNumbers } from "@/lib/utils";

interface AuctionAlertSettingsProps {
  auctionId: string;
  currentUserId?: string;
}

const AuctionAlertSettings = ({ auctionId, currentUserId }: AuctionAlertSettingsProps) => {
  const [priceAlert, setPriceAlert] = useState({
    enabled: false,
    targetPrice: "",
  });
  const [timeAlert, setTimeAlert] = useState({
    enabled: false,
    minutesBefore: "30",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAlerts = async () => {
    if (!currentUserId) {
      toast.error("يجب تسجيل الدخول لإنشاء التنبيهات");
      return;
    }

    setIsSaving(true);
    try {
      // حذف التنبيهات القديمة
      await supabase
        .from("auction_alerts")
        .delete()
        .eq("auction_id", auctionId)
        .eq("user_id", currentUserId);

      const alerts: any[] = [];

      // إضافة تنبيه السعر
      if (priceAlert.enabled && priceAlert.targetPrice) {
        alerts.push({
          auction_id: auctionId,
          user_id: currentUserId,
          alert_type: "price_reached",
          target_price: parseFloat(priceAlert.targetPrice),
          is_active: true,
        });
      }

      // إضافة تنبيه الوقت
      if (timeAlert.enabled && timeAlert.minutesBefore) {
        alerts.push({
          auction_id: auctionId,
          user_id: currentUserId,
          alert_type: "time_remaining",
          time_before_end: parseInt(timeAlert.minutesBefore),
          is_active: true,
        });
      }

      if (alerts.length > 0) {
        const { error } = await supabase.from("auction_alerts").insert(alerts);
        if (error) throw error;
        toast.success("تم حفظ التنبيهات بنجاح! 🔔");
      } else {
        toast.success("تم إلغاء جميع التنبيهات");
      }
    } catch (error) {
      console.error("Error saving alerts:", error);
      toast.error("فشل حفظ التنبيهات");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUserId) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            سجل الدخول لإنشاء تنبيهات للمزاد
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-border/50">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">التنبيهات الذكية</h3>
            <p className="text-sm text-muted-foreground">
              احصل على إشعارات للأحداث المهمة
            </p>
          </div>
        </div>

        {/* تنبيه السعر */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-primary" />
              <Label htmlFor="price-alert" className="font-medium">
                تنبيه عند وصول السعر
              </Label>
            </div>
            <Switch
              id="price-alert"
              checked={priceAlert.enabled}
              onCheckedChange={(checked) =>
                setPriceAlert({ ...priceAlert, enabled: checked })
              }
            />
          </div>
          {priceAlert.enabled && (
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                السعر المستهدف (ريال)
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={priceAlert.targetPrice}
                onChange={(e) =>
                  setPriceAlert({
                    ...priceAlert,
                    targetPrice: convertArabicToEnglishNumbers(e.target.value),
                  })
                }
                placeholder="مثال: 5000"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-2">
                سيتم إرسال تنبيه عندما يصل المزاد للسعر المحدد أو أقل
              </p>
            </div>
          )}
        </div>

        {/* تنبيه الوقت */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <Label htmlFor="time-alert" className="font-medium">
                تنبيه قبل انتهاء المزاد
              </Label>
            </div>
            <Switch
              id="time-alert"
              checked={timeAlert.enabled}
              onCheckedChange={(checked) =>
                setTimeAlert({ ...timeAlert, enabled: checked })
              }
            />
          </div>
          {timeAlert.enabled && (
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                الوقت قبل الانتهاء (بالدقائق)
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                value={timeAlert.minutesBefore}
                onChange={(e) =>
                  setTimeAlert({
                    ...timeAlert,
                    minutesBefore: convertArabicToEnglishNumbers(e.target.value),
                  })
                }
                placeholder="مثال: 30"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-2">
                سيتم إرسال تنبيه قبل انتهاء المزاد بالوقت المحدد
              </p>
            </div>
          )}
        </div>

        {/* معلومة إضافية */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              سيتم إرسال تنبيه تلقائي عندما يتجاوز أحدهم مزايدتك
            </span>
          </p>
        </div>

        <Button
          onClick={handleSaveAlerts}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold h-12 rounded-xl"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Bell className="h-5 w-5 ml-2" />
              حفظ التنبيهات
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default AuctionAlertSettings;
