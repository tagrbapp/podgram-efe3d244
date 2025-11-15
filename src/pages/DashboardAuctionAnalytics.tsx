import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, DollarSign, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Stats {
  total_auctions: number;
  active_auctions: number;
  ended_auctions: number;
  total_bids: number;
  avg_bids_per_auction: number;
  total_revenue: number;
  success_rate: number;
}

export default function DashboardAuctionAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: statsData } = await supabase.rpc('calculate_auction_stats', {
        _user_id: user.id,
        _days: parseInt(period)
      });

      const { data: timelineData } = await supabase.rpc('get_auction_timeline_data', {
        _user_id: user.id,
        _days: parseInt(period)
      });

      setStats(statsData as any);
      setTimelineData(timelineData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">جاري تحميل الإحصائيات...</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">إحصائيات المزادات المتقدمة</h1>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {['7', '30', '90'].map((days) => (
          <Button
            key={days}
            variant={period === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(days)}
          >
            آخر {days} يوم
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Gavel className="w-8 h-8 text-primary" />
            <div className="text-3xl font-bold">{stats?.total_auctions || 0}</div>
          </div>
          <div className="text-sm text-muted-foreground">إجمالي المزادات</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-500" />
            <div className="text-3xl font-bold">{stats?.success_rate?.toFixed(0) || 0}%</div>
          </div>
          <div className="text-sm text-muted-foreground">معدل النجاح</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div className="text-3xl font-bold">{stats?.avg_bids_per_auction?.toFixed(1) || 0}</div>
          </div>
          <div className="text-sm text-muted-foreground">متوسط العروض</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <div className="text-3xl font-bold">{(stats?.total_revenue || 0).toLocaleString()}</div>
          </div>
          <div className="text-sm text-muted-foreground">إجمالي الإيرادات (ر.س)</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">المزادات والعروض عبر الزمن</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="auctions_count" stroke="hsl(var(--primary))" name="المزادات" strokeWidth={2} />
              <Line type="monotone" dataKey="bids_count" stroke="hsl(var(--secondary))" name="العروض" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">الإيرادات اليومية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات (ر.س)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">نظرة عامة على الأداء</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="الإيرادات" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">ملخص الأداء</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm">إجمالي المزادات</span>
              <span className="font-bold">{stats?.total_auctions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm">المزادات النشطة</span>
              <span className="font-bold text-green-500">{stats?.active_auctions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm">المزادات المنتهية</span>
              <span className="font-bold">{stats?.ended_auctions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm">إجمالي العروض</span>
              <span className="font-bold text-blue-500">{stats?.total_bids || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}