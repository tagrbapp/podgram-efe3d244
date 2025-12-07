import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, Users, Gavel, TrendingUp, Clock, Calendar, 
  BarChart3, DollarSign, Activity, Target, ArrowUp, ArrowDown
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from "recharts";

interface AuctionAdminAnalyticsProps {
  auctionId: string;
  auction: {
    id: string;
    title: string;
    starting_price: number;
    current_bid: number | null;
    bid_increment: number;
    reserve_price: number | null;
    end_time: string;
    created_at: string;
    status: string;
    user_id: string;
    highest_bidder_id: string | null;
    views?: number | null;
  };
  bids: Array<{
    id: string;
    bid_amount: number;
    created_at: string;
    user_id: string;
    is_autobid: boolean;
  }>;
}

interface BidderProfile {
  id: string;
  full_name: string;
}

export const AuctionAdminAnalytics = ({ auctionId, auction, bids }: AuctionAdminAnalyticsProps) => {
  const [viewsAnalytics, setViewsAnalytics] = useState<any[]>([]);
  const [bidderProfiles, setBidderProfiles] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchBidderProfiles();
  }, [auctionId, bids]);

  const fetchAnalytics = async () => {
    try {
      const { data: viewsData } = await supabase
        .rpc("get_auction_views_analytics", { 
          _auction_id: auctionId,
          _days: 30 
        });

      if (viewsData) {
        setViewsAnalytics(viewsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBidderProfiles = async () => {
    const uniqueBidderIds = [...new Set(bids.map(b => b.user_id))];
    if (uniqueBidderIds.length === 0) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", uniqueBidderIds);

    if (profiles) {
      const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]));
      setBidderProfiles(profilesMap);
    }
  };

  // حسابات التحليلات
  const totalViews = auction.views || 0;
  const uniqueBidders = new Set(bids.map(b => b.user_id)).size;
  const totalBids = bids.length;
  const autoBids = bids.filter(b => b.is_autobid).length;
  const manualBids = totalBids - autoBids;
  
  const priceIncrease = auction.current_bid 
    ? ((auction.current_bid - auction.starting_price) / auction.starting_price * 100).toFixed(1)
    : 0;
  
  const avgBidAmount = totalBids > 0 
    ? bids.reduce((sum, b) => sum + b.bid_amount, 0) / totalBids 
    : 0;

  const highestBid = totalBids > 0 ? Math.max(...bids.map(b => b.bid_amount)) : 0;
  const lowestBid = totalBids > 0 ? Math.min(...bids.map(b => b.bid_amount)) : 0;

  // تحليل توقيت المزايدات
  const auctionDuration = differenceInHours(new Date(auction.end_time), new Date(auction.created_at));
  const hoursElapsed = differenceInHours(new Date(), new Date(auction.created_at));
  const progressPercent = Math.min((hoursElapsed / auctionDuration) * 100, 100);

  // تحضير بيانات الرسم البياني للمزايدات
  const bidChartData = bids
    .slice()
    .reverse()
    .map((bid, index) => ({
      time: format(new Date(bid.created_at), "HH:mm"),
      amount: bid.bid_amount,
      bidder: bidderProfiles.get(bid.user_id) || "مجهول",
      isAuto: bid.is_autobid,
    }));

  // تحليل المزايدين الأكثر نشاطاً
  const bidderActivity = bids.reduce((acc, bid) => {
    acc[bid.user_id] = (acc[bid.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topBidders = Object.entries(bidderActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, count]) => ({
      name: bidderProfiles.get(userId) || "مجهول",
      bids: count,
    }));

  // حساب متوسط الوقت بين المزايدات
  const avgTimeBetweenBids = totalBids > 1
    ? differenceInMinutes(
        new Date(bids[0].created_at), 
        new Date(bids[bids.length - 1].created_at)
      ) / (totalBids - 1)
    : 0;

  const stats = [
    {
      title: "إجمالي المشاهدات",
      value: totalViews.toLocaleString("en-US"),
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "عدد المزايدين",
      value: uniqueBidders.toLocaleString("en-US"),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "إجمالي المزايدات",
      value: totalBids.toLocaleString("en-US"),
      icon: Gavel,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "نسبة الزيادة",
      value: `${priceIncrease}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: Number(priceIncrease) > 0 ? "up" : "neutral",
    },
  ];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">تحليلات المزاد للإدارة</h3>
            <p className="text-sm text-muted-foreground">إحصائيات تفصيلية ومعلومات الأداء</p>
          </div>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          تقرير مباشر
        </Badge>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-background rounded-xl p-4 border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              {stat.trend === "up" && <ArrowUp className="h-4 w-4 text-green-500" />}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* رسم بياني للمزايدات */}
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            تطور المزايدات
          </h4>
          {bidChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bidChartData}>
                <defs>
                  <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toLocaleString("en-US")} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString("en-US")} ريال`, 'المبلغ']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#colorBid)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              لا توجد مزايدات بعد
            </div>
          )}
        </div>

        {/* أكثر المزايدين نشاطاً */}
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            أكثر المزايدين نشاطاً
          </h4>
          {topBidders.length > 0 ? (
            <div className="space-y-3">
              {topBidders.map((bidder, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-gray-100 text-gray-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-700' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{bidder.name}</span>
                  </div>
                  <Badge variant="secondary">{bidder.bids} مزايدة</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              لا توجد مزايدات بعد
            </div>
          )}
        </div>
      </div>

      {/* تفاصيل إضافية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">متوسط المزايدة</span>
          </div>
          <p className="text-lg font-bold">{avgBidAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ريال</p>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="h-4 w-4" />
            <span className="text-xs">أعلى مزايدة</span>
          </div>
          <p className="text-lg font-bold text-green-600">{highestBid.toLocaleString("en-US")} ريال</p>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ArrowDown className="h-4 w-4" />
            <span className="text-xs">أقل مزايدة</span>
          </div>
          <p className="text-lg font-bold">{lowestBid.toLocaleString("en-US")} ريال</p>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">متوسط الفاصل بين المزايدات</span>
          </div>
          <p className="text-lg font-bold">{Math.round(avgTimeBetweenBids)} دقيقة</p>
        </div>
      </div>

      {/* تفاصيل نوع المزايدات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <h4 className="font-semibold mb-4">نوع المزايدات</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">مزايدات يدوية</span>
                <span className="font-bold">{manualBids}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${totalBids > 0 ? (manualBids / totalBids) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">مزايدات تلقائية</span>
                <span className="font-bold">{autoBids}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${totalBids > 0 ? (autoBids / totalBids) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <h4 className="font-semibold mb-4">تقدم المزاد</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الوقت المنقضي</span>
              <span className="font-medium">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{format(new Date(auction.created_at), "PP", { locale: ar })}</span>
              <span>{format(new Date(auction.end_time), "PP", { locale: ar })}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
