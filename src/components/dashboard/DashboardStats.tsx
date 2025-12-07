import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, Eye, CheckCircle, Clock, Gavel, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Listing {
  id: string;
  status: string;
  views: number;
  created_at: string;
}

interface Auction {
  id: string;
  status: string;
  views: number | null;
  created_at: string | null;
  current_bid: number | null;
  starting_price: number;
}

interface DashboardStatsProps {
  listings: Listing[];
  auctions?: Auction[];
}

export const DashboardStats = ({ listings, auctions = [] }: DashboardStatsProps) => {
  // إحصائيات الإعلانات
  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");
  const totalListingViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

  // إحصائيات المزادات
  const activeAuctions = auctions.filter(a => a.status === "active");
  const endedAuctions = auctions.filter(a => a.status === "ended");
  const totalAuctionViews = auctions.reduce((sum, a) => sum + (a.views || 0), 0);

  // تحضير بيانات المشاهدات حسب اليوم (آخر 7 أيام)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const listingViewsByDay = last7Days.map(day => {
    const dayListings = listings.filter(l => l.created_at?.startsWith(day));
    return {
      day: new Date(day).toLocaleDateString('ar-SA', { weekday: 'short' }),
      views: dayListings.reduce((sum, l) => sum + (l.views || 0), 0),
      count: dayListings.length,
    };
  });

  const auctionViewsByDay = last7Days.map(day => {
    const dayAuctions = auctions.filter(a => a.created_at?.startsWith(day));
    return {
      day: new Date(day).toLocaleDateString('ar-SA', { weekday: 'short' }),
      views: dayAuctions.reduce((sum, a) => sum + (a.views || 0), 0),
      count: dayAuctions.length,
    };
  });

  // بيانات الإعلانات حسب الحالة
  const listingStatusData = [
    { name: "نشطة", value: activeListings.length },
    { name: "مباعة", value: soldListings.length },
    { name: "غير نشطة", value: listings.filter(l => l.status === "inactive").length },
  ];

  // بيانات المزادات حسب الحالة
  const auctionStatusData = [
    { name: "نشطة", value: activeAuctions.length },
    { name: "منتهية", value: endedAuctions.length },
    { name: "معلقة", value: auctions.filter(a => a.status === "pending").length },
  ];

  const listingStats = [
    {
      title: "إجمالي الإعلانات",
      value: listings.length.toLocaleString('en-US'),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "الإعلانات النشطة",
      value: activeListings.length.toLocaleString('en-US'),
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "المباعة",
      value: soldListings.length.toLocaleString('en-US'),
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "إجمالي المشاهدات",
      value: totalListingViews.toLocaleString('en-US'),
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const auctionStats = [
    {
      title: "إجمالي المزادات",
      value: auctions.length.toLocaleString('en-US'),
      icon: Gavel,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "المزادات النشطة",
      value: activeAuctions.length.toLocaleString('en-US'),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "المنتهية",
      value: endedAuctions.length.toLocaleString('en-US'),
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "إجمالي المشاهدات",
      value: totalAuctionViews.toLocaleString('en-US'),
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="auctions">تحليلات المزادات</TabsTrigger>
          <TabsTrigger value="listings">تحليلات الإعلانات</TabsTrigger>
        </TabsList>

        {/* تحليلات الإعلانات */}
        <TabsContent value="listings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {listingStats.map((stat, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">المشاهدات خلال آخر 7 أيام</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={listingViewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => value.toLocaleString('en-US')} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: 'ltr' }}
                    formatter={(value: number) => [value.toLocaleString('en-US'), 'المشاهدات']}
                  />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">الإعلانات حسب الحالة</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={listingStatusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => value.toLocaleString('en-US')} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: 'ltr' }}
                    formatter={(value: number) => [value.toLocaleString('en-US'), 'العدد']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* تحليلات المزادات */}
        <TabsContent value="auctions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {auctionStats.map((stat, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">مشاهدات المزادات خلال آخر 7 أيام</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={auctionViewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => value.toLocaleString('en-US')} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: 'ltr' }}
                    formatter={(value: number) => [value.toLocaleString('en-US'), 'المشاهدات']}
                  />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent))', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">المزادات حسب الحالة</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={auctionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => value.toLocaleString('en-US')} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', direction: 'ltr' }}
                    formatter={(value: number) => [value.toLocaleString('en-US'), 'العدد']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
