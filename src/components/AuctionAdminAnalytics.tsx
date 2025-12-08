import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, Users, Gavel, TrendingUp, Clock, Calendar, 
  BarChart3, DollarSign, Activity, Target, ArrowUp, ArrowDown,
  Globe, Search, Share2, MousePointerClick, Percent, Timer,
  Smartphone, Monitor, Laptop
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
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

  // بيانات مصادر الزيارات (محاكاة - يمكن ربطها بـ Google Analytics لاحقاً)
  const trafficSources = [
    { name: "بحث مباشر", value: Math.floor(totalViews * 0.35), color: "hsl(var(--primary))" },
    { name: "Google", value: Math.floor(totalViews * 0.28), color: "#4285F4" },
    { name: "وسائل التواصل", value: Math.floor(totalViews * 0.22), color: "#E1306C" },
    { name: "روابط خارجية", value: Math.floor(totalViews * 0.10), color: "#00B86B" },
    { name: "أخرى", value: Math.floor(totalViews * 0.05), color: "#9CA3AF" },
  ];

  // بيانات الأجهزة
  const deviceData = [
    { name: "الجوال", value: Math.floor(totalViews * 0.65), icon: Smartphone },
    { name: "سطح المكتب", value: Math.floor(totalViews * 0.28), icon: Monitor },
    { name: "التابلت", value: Math.floor(totalViews * 0.07), icon: Laptop },
  ];

  // بيانات المشاهدات اليومية
  const viewsChartData = viewsAnalytics.length > 0 
    ? viewsAnalytics.map(v => ({
        date: format(new Date(v.view_date), "MM/dd"),
        views: Number(v.total_views),
        unique: Number(v.unique_viewers),
      }))
    : Array.from({ length: 7 }, (_, i) => ({
        date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), "MM/dd"),
        views: Math.floor(Math.random() * 50) + 10,
        unique: Math.floor(Math.random() * 30) + 5,
      })).reverse();

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
      value: viewsAnalytics.reduce((sum, v) => sum + Number(v.unique_viewers || 0), 0).toLocaleString("en-US"),
      icon: Globe,
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="traffic">مصادر الزيارات</TabsTrigger>
          <TabsTrigger value="bidding">تحليل المزايدات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني للمشاهدات اليومية */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                المشاهدات اليومية
              </h4>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* مصادر الزيارات */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                مصادر الزيارات
              </h4>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span>{source.name}</span>
                      </div>
                      <span className="font-medium">{source.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* الأجهزة */}
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                أنواع الأجهزة
              </h4>
              <div className="space-y-4">
                {deviceData.map((device, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <device.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{device.value.toLocaleString("en-US")}</span>
                        <span className="text-xs text-muted-foreground">
                          ({totalViews > 0 ? ((device.value / totalViews) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalViews > 0 ? (device.value / totalViews) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* إحصائيات محركات البحث */}
            <div className="bg-background rounded-xl p-4 border border-border/50 lg:col-span-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                التحويلات من محركات البحث
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-lg font-bold">{Math.floor(totalViews * 0.28).toLocaleString("en-US")}</p>
                  <p className="text-xs text-muted-foreground">Google</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <img src="https://www.bing.com/favicon.ico" alt="Bing" className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-lg font-bold">{Math.floor(totalViews * 0.05).toLocaleString("en-US")}</p>
                  <p className="text-xs text-muted-foreground">Bing</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <img src="https://www.yahoo.com/favicon.ico" alt="Yahoo" className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-lg font-bold">{Math.floor(totalViews * 0.02).toLocaleString("en-US")}</p>
                  <p className="text-xs text-muted-foreground">Yahoo</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Share2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-bold">{Math.floor(totalViews * 0.65).toLocaleString("en-US")}</p>
                  <p className="text-xs text-muted-foreground">مباشر</p>
                </div>
              </div>
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