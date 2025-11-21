import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, Trophy, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AchievementStats {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  achievement_type: string;
  requirement_value: number;
  reward_points: number;
  earned_count: number;
  total_times_earned: number;
  is_repeatable: boolean;
}

const DashboardAchievementsReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [achievementStats, setAchievementStats] = useState<AchievementStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersWithAchievements, setUsersWithAchievements] = useState(0);
  const [totalAchievementsEarned, setTotalAchievementsEarned] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);

      if (!roles || roles.length === 0) {
        navigate("/dashboard");
        toast.error("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      setIsAdmin(true);
      await loadReports();
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const loadReports = async () => {
    try {
      // Get all achievements with their earned counts
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false });

      if (achievementsError) throw achievementsError;

      // Get user achievements stats
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, times_earned, user_id");

      if (userAchievementsError) throw userAchievementsError;

      // Calculate stats for each achievement
      const stats: AchievementStats[] = (achievements || []).map((achievement) => {
        const achievementEarns = userAchievements?.filter(
          (ua) => ua.achievement_id === achievement.id
        ) || [];
        
        const uniqueUsers = new Set(achievementEarns.map(ua => ua.user_id)).size;
        const totalTimes = achievementEarns.reduce((sum, ua) => sum + ua.times_earned, 0);

        return {
          ...achievement,
          earned_count: uniqueUsers,
          total_times_earned: totalTimes,
        };
      });

      // Sort by earned count descending
      stats.sort((a, b) => b.earned_count - a.earned_count);
      setAchievementStats(stats);

      // Calculate overall stats
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const uniqueUsersWithAchievements = new Set(
        userAchievements?.map(ua => ua.user_id) || []
      ).size;

      const totalEarned = userAchievements?.reduce(
        (sum, ua) => sum + ua.times_earned,
        0
      ) || 0;

      setTotalUsers(usersCount || 0);
      setUsersWithAchievements(uniqueUsersWithAchievements);
      setTotalAchievementsEarned(totalEarned);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("فشل تحميل التقارير");
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
                <h1 className="text-2xl font-bold">تقارير الإنجازات</h1>
              </div>
            </header>
            <main className="container mx-auto p-6 space-y-6">
              <Skeleton className="h-64 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">تقارير الإنجازات التفصيلية</h1>
            </div>
          </header>
          <main className="container mx-auto p-6 space-y-6 max-w-6xl">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers.toLocaleString("en-US")}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {usersWithAchievements.toLocaleString("en-US")} لديهم إنجازات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإنجازات المحققة</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAchievementsEarned.toLocaleString("en-US")}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    عبر جميع المستخدمين
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">متوسط الإنجازات للمستخدم</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usersWithAchievements > 0
                      ? (totalAchievementsEarned / usersWithAchievements).toFixed(1)
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    إنجاز لكل مستخدم نشط
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Achievements Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الإنجازات</CardTitle>
                <CardDescription>
                  إحصائيات مفصلة لكل إنجاز وعدد المستخدمين الذين حققوه
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievementStats.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    لا توجد إنجازات بعد
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الإنجاز</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">القيمة المطلوبة</TableHead>
                        <TableHead className="text-right">النقاط</TableHead>
                        <TableHead className="text-right">عدد المستخدمين</TableHead>
                        <TableHead className="text-right">إجمالي المرات</TableHead>
                        <TableHead className="text-right">نسبة التحقيق</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {achievementStats.map((achievement, index) => {
                        const achievementRate = totalUsers > 0
                          ? ((achievement.earned_count / totalUsers) * 100).toFixed(1)
                          : "0";

                        return (
                          <TableRow key={achievement.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {achievement.name}
                                    {index === 0 && achievement.earned_count > 0 && (
                                      <Badge variant="default">الأكثر تحقيقاً</Badge>
                                    )}
                                    {achievement.is_repeatable && (
                                      <Badge variant="outline">قابل للتكرار</Badge>
                                    )}
                                  </div>
                                  {achievement.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {achievement.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {achievement.achievement_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{achievement.requirement_value.toLocaleString("en-US")}</TableCell>
                            <TableCell className="text-green-600 font-semibold">
                              {achievement.reward_points.toLocaleString("en-US")}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {achievement.earned_count.toLocaleString("en-US")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {achievement.total_times_earned.toLocaleString("en-US")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">{achievementRate}%</div>
                                <div className="w-full max-w-[100px] bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${achievementRate}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardAchievementsReports;
