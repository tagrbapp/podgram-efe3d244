import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  level: number;
}

const DashboardLeaderboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

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
        return;
      }

      setIsAdmin(true);
      await loadLeaderboard();
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const loadLeaderboard = async () => {
    try {
      const { data: pointsData, error: pointsError } = await supabase
        .from("user_points")
        .select("user_id, total_points, level")
        .order("total_points", { ascending: false });

      if (pointsError) throw pointsError;

      if (pointsData && pointsData.length > 0) {
        const userIds = pointsData.map((p) => p.user_id);

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        const combined = pointsData.map((points) => {
          const profile = profilesData?.find((p) => p.id === points.user_id);
          return {
            id: points.user_id,
            full_name: profile?.full_name || "مستخدم",
            avatar_url: profile?.avatar_url || null,
            total_points: points.total_points || 0,
            level: points.level || 1,
          };
        });

        setLeaderboard(combined);
        setTotalPoints(combined.reduce((sum, user) => sum + user.total_points, 0));
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700";
      default:
        return "bg-muted";
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
                <h1 className="text-2xl font-bold">لوحة المتصدرين</h1>
              </div>
            </header>
            <main className="container mx-auto p-6 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-96 w-full" />
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
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">لوحة المتصدرين</h1>
            </div>
          </header>
          <main className="container mx-auto p-6 space-y-6 max-w-5xl">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {totalPoints.toLocaleString("en-US")}
                  </div>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">عدد المستخدمين</CardTitle>
                  <Medal className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {leaderboard.length.toLocaleString("en-US")}
                  </div>
                  <p className="text-xs text-muted-foreground">مستخدم</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">متوسط النقاط</CardTitle>
                  <Award className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {leaderboard.length > 0
                      ? Math.round(totalPoints / leaderboard.length).toLocaleString("en-US")
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle>ترتيب الأعضاء حسب النقاط</CardTitle>
                <CardDescription>
                  قائمة جميع المستخدمين مرتبة من الأعلى إلى الأقل حسب النقاط المكتسبة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => {
                      const rank = index + 1;
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all ${
                            rank <= 3 ? "bg-accent/50" : "hover:bg-accent/20"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Rank */}
                            <div
                              className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(
                                rank
                              )}`}
                            >
                              <span className="text-lg font-bold text-white">
                                {rank}
                              </span>
                            </div>

                            {/* Rank Icon */}
                            <div className="flex-shrink-0">{getRankIcon(rank)}</div>

                            {/* User Info */}
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                المستوى {user.level}
                              </p>
                            </div>

                            {/* Points */}
                            <div className="text-left">
                              <Badge
                                variant="secondary"
                                className="text-base font-bold px-4 py-2"
                              >
                                {user.total_points.toLocaleString("en-US")} نقطة
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLeaderboard;
