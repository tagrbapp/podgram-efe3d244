import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuctionAlertFormProps {
  auctionId: string;
  currentBid?: number;
  onSuccess?: () => void;
}

export const AuctionAlertForm = ({ auctionId, currentBid, onSuccess }: AuctionAlertFormProps) => {
  const [alertType, setAlertType] = useState<'price_reached' | 'time_remaining'>('price_reached');
  const [targetPrice, setTargetPrice] = useState('');
  const [timeBeforeEnd, setTimeBeforeEnd] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      const alertData: any = {
        user_id: user.id,
        auction_id: auctionId,
        alert_type: alertType,
        is_active: true
      };

      if (alertType === 'price_reached') {
        if (!targetPrice || parseFloat(targetPrice) <= 0) {
          toast.error('الرجاء إدخال سعر صحيح');
          return;
        }
        alertData.target_price = parseFloat(targetPrice);
      } else {
        if (!timeBeforeEnd || parseInt(timeBeforeEnd) <= 0) {
          toast.error('الرجاء إدخال وقت صحيح');
          return;
        }
        alertData.time_before_end = parseInt(timeBeforeEnd);
      }

    const { error } = await supabase
      .from('auction_alerts')
      .insert(alertData);

      if (error) throw error;

      toast.success('تم إنشاء التنبيه بنجاح');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('فشل إنشاء التنبيه');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">إنشاء تنبيه</h3>
      </div>

      <div className="space-y-6">
        <RadioGroup value={alertType} onValueChange={(v: any) => setAlertType(v)} dir="rtl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="price_reached" id="price" />
            <Label htmlFor="price" className="flex items-center gap-2 cursor-pointer">
              <DollarSign className="w-4 h-4" />
              <span>أخبرني عند وصول السعر إلى...</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="time_remaining" id="time" />
            <Label htmlFor="time" className="flex items-center gap-2 cursor-pointer">
              <Clock className="w-4 h-4" />
              <span>أخبرني قبل انتهاء المزاد بـ...</span>
            </Label>
          </div>
        </RadioGroup>

        {alertType === 'price_reached' ? (
          <div className="space-y-2">
            <Label>السعر المستهدف (ريال)</Label>
            <Input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={currentBid ? `أعلى من ${currentBid}` : 'أدخل السعر'}
              min={currentBid || 0}
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">
              سنرسل لك تنبيهاً عندما يصل المزاد لهذا السعر أو أقل
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>الوقت قبل الانتهاء (دقيقة)</Label>
            <Input
              type="number"
              value={timeBeforeEnd}
              onChange={(e) => setTimeBeforeEnd(e.target.value)}
              placeholder="30"
              min="1"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">
              سنرسل لك تنبيهاً قبل انتهاء المزاد بهذا الوقت
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء التنبيه'}
        </Button>
      </div>
    </Card>
  );
};