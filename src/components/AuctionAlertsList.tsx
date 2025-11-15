import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, DollarSign, Clock, Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Alert {
  id: string;
  alert_type: string;
  target_price: number | null;
  time_before_end: number | null;
  is_triggered: boolean;
  is_active: boolean;
}

interface AuctionAlertsListProps {
  auctionId: string;
}

export const AuctionAlertsList = ({ auctionId }: AuctionAlertsListProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('auction_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('auction_alerts')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('auction_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('تم حذف التنبيه');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('فشل حذف التنبيه');
    }
  };

  const toggleActive = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('auction_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: !isActive } : a));
      toast.success(isActive ? 'تم تعطيل التنبيه' : 'تم تفعيل التنبيه');
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('فشل تحديث التنبيه');
    }
  };

  if (loading) return <Card className="p-6">جاري التحميل...</Card>;

  if (alerts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">لا توجد تنبيهات لهذا المزاد</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">التنبيهات النشطة</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {alert.alert_type === 'price_reached' ? (
                <DollarSign className="w-5 h-5 text-primary" />
              ) : (
                <Clock className="w-5 h-5 text-primary" />
              )}
              <div>
                <div className="font-medium text-sm">
                  {alert.alert_type === 'price_reached'
                    ? `السعر ${alert.target_price} ريال`
                    : `قبل ${alert.time_before_end} دقيقة`}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {alert.is_triggered && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="w-3 h-3 ml-1" />
                      تم التفعيل
                    </Badge>
                  )}
                  <Badge variant={alert.is_active ? 'default' : 'outline'} className="text-xs">
                    {alert.is_active ? 'نشط' : 'معطل'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleActive(alert.id, alert.is_active)}
                disabled={alert.is_triggered}
              >
                {alert.is_active ? 'تعطيل' : 'تفعيل'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(alert.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};