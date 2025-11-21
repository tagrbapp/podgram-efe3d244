import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Gift, TrendingUp, Users, Award, Crown } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ReferralStats {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  referral_code: string | null;
  total_referrals: number;
  points_earned: number;
  created_at: string;
}

const DashboardReferralStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalUsers: 0,
    totalReferrals: 0,
    totalPoints: 0,
    avgReferralsPerUser: 0,
    topReferrer: { name: '', count: 0 }
  });

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (!roleData || roleData.role !== 'admin') {
        toast.error("غير مصرح لك بالوصول لهذه الصفحة");
        navigate("/dashboard");
        return;
      }

      await loadReferralStats();
    };

    checkAuthAndLoad();
  }, [navigate]);

  const loadReferralStats = async () => {
    try {
      // Get all users with their referral codes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, referral_code, created_at')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Calculate referral statistics for each user
      const statsPromises = (profiles || []).map(async (profile) => {
        const { data: referrals } = await supabase
          .from('profiles')
          .select('id')
          .eq('referred_by', profile.id);

        const totalReferrals = referrals?.length || 0;
        const pointsEarned = totalReferrals * 10;

        return {
          user_id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          referral_code: profile.referral_code,
          total_referrals: totalReferrals,
          points_earned: pointsEarned,
          created_at: profile.created_at
        };
      });

      const stats = await Promise.all(statsPromises);
      
      // Sort by total referrals descending
      const sortedStats = stats.sort((a, b) => b.total_referrals - a.total_referrals);
      setReferralStats(sortedStats);

      // Calculate overall statistics
      const totalUsers = stats.length;
      const totalReferrals = stats.reduce((sum, s) => sum + s.total_referrals, 0);
      const totalPoints = stats.reduce((sum, s) => sum + s.points_earned, 0);
      const avgReferralsPerUser = totalUsers > 0 ? totalReferrals / totalUsers : 0;
      
      const topReferrer = sortedStats[0] 
        ? { name: sortedStats[0].full_name, count: sortedStats[0].total_referrals }
        : { name: 'لا يوجد', count: 0 };

      setOverallStats({
        totalUsers,
        totalReferrals,
        totalPoints,
        avgReferralsPerUser,
        topReferrer
      });

    } catch (error) {
      console.error('Error loading referral stats:', error);
      toast.error("خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                إحصائيات الإحالات - جميع الأعضاء
              </h1>
              <p className="text-muted-foreground">
                نظرة شاملة على أداء نظام الإحالات لجميع المستخدمين
              </p>
            </div>

            {/* Overall Statistics Cards */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" />
                    إجمالي الأعضاء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {overallStats.totalUsers.toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    جميع المستخدمين المسجلين
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4 text-primary" />
                    إجمالي الإحالات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {overallStats.totalReferrals.toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    جميع الإحالات الناجحة
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gift className="h-4 w-4 text-primary" />
                    إجمالي النقاط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {overallStats.totalPoints.toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    نقاط من الإحالات
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    متوسط الإحالات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {overallStats.avgReferralsPerUser.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    لكل مستخدم
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-primary" />
                    أفضل مُحيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold text-primary truncate">
                    {overallStats.topReferrer.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overallStats.topReferrer.count} إحالة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  تفاصيل الإحالات لكل عضو
                </CardTitle>
                <CardDescription>
                  قائمة شاملة بإحصائيات الإحالات لجميع الأعضاء مرتبة حسب الأفضل
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">العضو</TableHead>
                          <TableHead className="text-right">كود الإحالة</TableHead>
                          <TableHead className="text-right">عدد الإحالات</TableHead>
                          <TableHead className="text-right">النقاط المكتسبة</TableHead>
                          <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralStats.map((stat, index) => (
                          <TableRow key={stat.user_id} className={index < 3 ? "bg-primary/5" : ""}>
                            <TableCell className="font-medium">
                              {index < 3 ? (
                                <Badge variant="default" className="gap-1">
                                  {index === 0 && <Crown className="h-3 w-3" />}
                                  {index + 1}
                                </Badge>
                              ) : (
                                index + 1
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={stat.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {stat.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{stat.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="px-2 py-1 bg-muted rounded text-sm">
                                {stat.referral_code || '-'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stat.total_referrals > 0 ? "default" : "secondary"}>
                                {stat.total_referrals.toLocaleString("en-US")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <Gift className="h-4 w-4 text-primary" />
                                {stat.points_earned.toLocaleString("en-US")}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(stat.created_at), "d MMMM yyyy", { locale: ar })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد بيانات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardReferralStats;
