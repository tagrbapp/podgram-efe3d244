import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, Eye, CheckCircle, Clock } from "lucide-react";

interface Listing {
  id: string;
  status: string;
  views: number;
  created_at: string;
}

interface DashboardStatsProps {
  listings: Listing[];
}

export const DashboardStats = ({ listings }: DashboardStatsProps) => {
  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);

  // تحضير بيانات المشاهدات حسب اليوم (آخر 7 أيام)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const viewsByDay = last7Days.map(day => {
    const dayListings = listings.filter(l => l.created_at.startsWith(day));
    return {
      day: new Date(day).toLocaleDateString('ar-SA', { weekday: 'short' }),
      views: dayListings.reduce((sum, l) => sum + l.views, 0),
      listings: dayListings.length,
    };
  });

  // بيانات الإعلانات حسب الحالة
  const statusData = [
    { name: "نشطة", value: activeListings.length, color: "#22c55e" },
    { name: "مباعة", value: soldListings.length, color: "#3b82f6" },
    { name: "غير نشطة", value: listings.filter(l => l.status === "inactive").length, color: "#f59e0b" },
  ];

  const stats = [
    {
      title: "إجمالي الإعلانات",
      value: listings.length,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "الإعلانات النشطة",
      value: activeListings.length,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "المباعة",
      value: soldListings.length,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "إجمالي المشاهدات",
      value: totalViews.toLocaleString('ar-SA'),
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* رسم بياني للمشاهدات */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">المشاهدات خلال آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viewsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* رسم بياني للإعلانات حسب الحالة */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">الإعلانات حسب الحالة</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
