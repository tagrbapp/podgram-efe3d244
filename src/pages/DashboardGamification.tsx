import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSession } from "@/lib/auth";
import {
  getUserPoints,
  getAllBadges,
  getUserBadges,
  getPointsHistory,
  getLevelProgress,
  UserPoints,
  Badge,
  UserBadge,
  PointsHistoryItem,
} from "@/lib/gamification";
import BadgeDisplay from "@/components/BadgeDisplay";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const DashboardGamification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
      if (!user) {
        navigate("/auth");
        return;
      }
      loadGamificationData(user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadGamificationData = async (userId: string) => {
    setLoading(true);
    try {
      const [points, badges, earned, history] = await Promise.all([
        getUserPoints(userId),
        getAllBadges(),
        getUserBadges(userId),
        getPointsHistory(userId),
      ]);

      setUserPoints(points);
      setAllBadges(badges);
      setUserBadges(earned);
      setPointsHistory(history);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <header className="sticky top-0 z-10 bg-background border-b">
              <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <h1 className="text-2xl font-bold">النقاط والشارات</h1>
              </div>
            </header>
            <main className="container mx-auto p-6 space-y-6">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const levelProgress = userPoints ? getLevelProgress(userPoints.total_points) : null;
  const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">النقاط والشارات</h1>
            </div>
          </header>
          <main className="container mx-auto p-6 space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">النقاط الإجمالية</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userPoints?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المستوى الحالي</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">المستوى {levelProgress?.currentLevel || 1}</div>
            {levelProgress && (
              <div className="mt-2 space-y-1">
                <Progress value={levelProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {levelProgress.pointsNeeded} نقطة للمستوى التالي
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الشارات المكتسبة</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userBadges.length}</div>
            <p className="text-xs text-muted-foreground">من أصل {allBadges.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الشارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allBadges.map((badge) => {
              const earned = earnedBadgeIds.includes(badge.id);
              return (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  earned={earned}
                  size="md"
                  showDescription={true}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل النقاط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pointsHistory.length === 0 ? (
              <p className="text-center text-muted-foreground">لا توجد نقاط بعد</p>
            ) : (
              pointsHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "PPp")}
                    </p>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      item.points > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.points > 0 ? "+" : ""}
                    {item.points}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardGamification;
