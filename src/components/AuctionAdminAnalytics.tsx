import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, Users, Gavel, TrendingUp, Clock, Calendar, 
  BarChart3, DollarSign, Activity, Target, ArrowDown,
  MousePointerClick, Percent, Timer
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
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

  // معدل التحويل (من زائر إلى مزايد)
  const conversionRate = totalViews > 0 ? ((uniqueBidders / totalViews) * 100).toFixed(2) : 0;
  
  // معدل المشاركة (عدد المزايدات لكل مزايد)
  const engagementRate = uniqueBidders > 0 ? (totalBids / uniqueBidders).toFixed(1) : 0;

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

  // حساب الزوار الفريدين من بيانات المزاد
  const uniqueViewers = viewsAnalytics.reduce((sum, v) => sum + Number(v.unique_viewers || 0), 0);

  // بيانات المشاهدات اليومية - البيانات الحقيقية فقط من قاعدة البيانات
  const viewsChartData = viewsAnalytics.length > 0 
    ? viewsAnalytics.map(v => ({
        date: format(new Date(v.view_date), "MM/dd"),
        views: Number(v.total_views),
        unique: Number(v.unique_viewers),
      })).reverse()
    : [];

  // تحليل أوقات الذروة للمزايدات
  const peakHours = bids.reduce((acc, bid) => {
    const hour = new Date(bid.created_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakHoursData = Object.entries(peakHours)
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      bids: count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

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
      title: "معدل التحويل",
      value: `${conversionRate}%`,
      icon: MousePointerClick,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const secondaryStats = [
    {
      title: "نسبة زيادة السعر",
      value: `${priceIncrease}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: Number(priceIncrease) > 0 ? "up" : "neutral",
    },
    {
      title: "معدل المشاركة",
      value: `${engagementRate}x`,
      icon: Activity,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "متوسط وقت المزايدة",
      value: `${Math.round(avgTimeBetweenBids)} د`,
      icon: Timer,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "الزوار الفريدين",
      value: uniqueViewers.toLocaleString("en-US"),
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-background rounded-xl p-4 border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* بطاقات الإحصائيات الثانوية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {secondaryStats.map((stat, index) => (
          <div key={index} className="bg-background rounded-xl p-3 border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3 w-3 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="bidding">تحليل المزايدات</TabsTrigger>
          <TabsTrigger value="traffic">مصادر الزيارات</TabsTrigger>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني للمشاهدات اليومية */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-right">
                <Eye className="h-4 w-4 text-primary" />
                المشاهدات اليومية لهذا المزاد
              </h4>
              {viewsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={viewsChartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      name="المشاهدات"
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorViews)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="unique" 
                      name="الزوار الفريدين"
                      stroke="hsl(var(--accent))" 
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات مشاهدات لهذا المزاد بعد
                </div>
              )}
            </div>

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
          </div>
        </TabsContent>

        <TabsContent value="traffic">
          <div className="grid grid-cols-1 gap-6">
            {/* إحصائيات المشاهدات لهذا المزاد */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-right">
                <Eye className="h-4 w-4 text-primary" />
                تفاصيل المشاهدات لهذا المزاد
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString("en-US")}</p>
                  <p className="text-xs text-blue-600">إجمالي المشاهدات</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{uniqueViewers.toLocaleString("en-US")}</p>
                  <p className="text-xs text-green-600">الزوار الفريدين</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MousePointerClick className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
                  <p className="text-xs text-purple-600">معدل التحويل للمزايدة</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{engagementRate}x</p>
                  <p className="text-xs text-orange-600">معدل المشاركة</p>
                </div>
              </div>
            </div>

            {/* تفاصيل المشاهدات اليومية */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-right">
                <Calendar className="h-4 w-4 text-primary" />
                سجل المشاهدات اليومية
              </h4>
              {viewsAnalytics.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {viewsAnalytics.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{format(new Date(day.view_date), "yyyy/MM/dd")}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <span className="text-sm text-muted-foreground">مشاهدات: </span>
                          <span className="font-bold">{Number(day.total_views).toLocaleString("en-US")}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-sm text-muted-foreground">زوار فريدين: </span>
                          <span className="font-bold text-primary">{Number(day.unique_viewers).toLocaleString("en-US")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات مشاهدات مسجلة لهذا المزاد بعد
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bidding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* أوقات ذروة المزايدات */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                أوقات ذروة المزايدات
              </h4>
              {peakHoursData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                      formatter={(value: number) => [`${value} مزايدة`, 'العدد']}
                    />
                    <Bar dataKey="bids" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات كافية
                </div>
              )}
            </div>

            {/* تفاصيل نوع المزايدات */}
            <div className="bg-background rounded-xl p-4 border border-border/50 lg:col-span-2">
              <h4 className="font-semibold mb-4">نوع المزايدات</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مزايدات يدوية</span>
                    <span className="font-bold">{manualBids}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${totalBids > 0 ? (manualBids / totalBids) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مزايدات تلقائية</span>
                    <span className="font-bold">{autoBids}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${totalBids > 0 ? (autoBids / totalBids) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* تفاصيل المزايدات */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                تحليل الأسعار
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">متوسط المزايدة</span>
                  <span className="font-bold">{avgBidAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ريال</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">أعلى مزايدة</span>
                  <span className="font-bold text-green-700">{highestBid.toLocaleString("en-US")} ريال</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">أقل مزايدة</span>
                  <span className="font-bold">{lowestBid.toLocaleString("en-US")} ريال</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm text-primary">السعر الحالي</span>
                  <span className="font-bold text-primary">{(auction.current_bid || auction.starting_price).toLocaleString("en-US")} ريال</span>
                </div>
              </div>
            </div>

            {/* تقدم المزاد */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                تقدم المزاد
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الوقت المنقضي</span>
                  <span className="font-medium">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(auction.created_at), "PP", { locale: ar })}</span>
                  <span>{format(new Date(auction.end_time), "PP", { locale: ar })}</span>
                </div>

                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">الوقت المتبقي</span>
                    <Badge variant={auction.status === "active" ? "default" : "secondary"}>
                      {auction.status === "active" ? "نشط" : "منتهي"}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">
                    {auction.status === "active" 
                      ? formatDistanceToNow(new Date(auction.end_time), { locale: ar, addSuffix: true })
                      : "انتهى المزاد"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ملخص الأداء */}
            <div className="bg-background rounded-xl p-4 border border-border/50 lg:col-span-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                ملخص الأداء
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Percent className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
                  <p className="text-xs text-blue-600">معدل التحويل</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{priceIncrease}%</p>
                  <p className="text-xs text-green-600">نسبة الزيادة</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{engagementRate}x</p>
                  <p className="text-xs text-purple-600">معدل المشاركة</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Timer className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{Math.round(avgTimeBetweenBids)} د</p>
                  <p className="text-xs text-orange-600">متوسط الفاصل</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};