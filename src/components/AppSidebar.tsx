import { LayoutDashboard, Heart, Settings, Package, TrendingUp, FileText, MessageCircle, LogOut, Shield, Trophy, BarChart, Gavel, TestTube, Megaphone, Image, UserCheck, Home, Users, FolderTree, ChevronUp, ChevronDown, Palette, Calculator, Award, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import podgramLogo from "@/assets/podgram-logo.png";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

const mainItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "إعلاناتي", url: "/dashboard/listings", icon: Package },
  { title: "المزادات", url: "/dashboard/auctions", icon: Gavel },
  { title: "إحصائيات المزادات", url: "/dashboard/auction-analytics", icon: BarChart },
  { title: "ملفي كمزايد", url: "/dashboard/bidder-profile", icon: Trophy },
  { title: "الرسائل", url: "/messages", icon: MessageCircle },
  { title: "المفضلة", url: "/favorites", icon: Heart },
  { title: "الإحصائيات", url: "/dashboard/analytics", icon: TrendingUp },
  { title: "التقارير", url: "/dashboard/reports", icon: FileText },
];

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
  { title: "اختبار الإشعارات", url: "/test-notifications", icon: TestTube },
];

const adminItems = [
  { title: "إدارة الأعضاء", url: "/dashboard/user-approvals", icon: UserCheck },
  { title: "إدارة الأدوار والصلاحيات", url: "/dashboard/roles", icon: Users },
  { title: "إدارة البلاغات", url: "/dashboard/reports/admin", icon: Shield },
  { title: "إدارة الفئات", url: "/dashboard/categories", icon: FolderTree },
  { title: "احتساب النقاط", url: "/dashboard/points-calculation", icon: Calculator },
  { title: "لوحة المتصدرين", url: "/dashboard/leaderboard", icon: Award },
  { title: "إدارة المكافآت", url: "/dashboard/achievements", icon: Trophy },
  { title: "تقارير الإنجازات", url: "/dashboard/achievements-reports", icon: BarChart3 },
  { title: "إدارة الصفحة الرئيسية", url: "/dashboard/homepage", icon: Home },
  { title: "إدارة الشريط العلوي", url: "/dashboard/top-bar", icon: ChevronUp },
  { title: "إدارة الفوتر", url: "/dashboard/footer", icon: ChevronDown },
  { title: "إدارة ألوان الموقع", url: "/dashboard/theme", icon: Palette },
  { title: "إدارة الإعلانات", url: "/dashboard/announcements", icon: Megaphone },
  { title: "إدارة الـ Hero Carousel", url: "/dashboard/hero-carousel", icon: Image },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    if (roles && roles.length > 0) {
      setIsAdmin(true);
      fetchPendingReportsCount();
    }
  };

  const fetchPendingReportsCount = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && data) {
      setPendingReportsCount(data.length || 0);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("فشل تسجيل الخروج");
      return;
    }
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/");
  };

  return (
    <Sidebar className={`transition-all duration-300 ease-in-out ${state === "collapsed" ? "w-16" : "w-64"}`} side="right">
      <SidebarContent className="bg-card border-l">
        {/* Logo */}
        <div className="p-4 border-b transition-all duration-300">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 cursor-pointer group">
              <img src={podgramLogo} alt="Podgram" className="h-10 w-10 object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {state !== "collapsed" && (
                <span className="text-xl font-bold text-qultura-blue animate-fade-in group-hover:text-primary transition-colors duration-200">
                  Podgram
                </span>
              )}
            </Link>
            {state !== "collapsed" && <NotificationsDropdown userId={currentUserId} />}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="py-4 transition-all duration-300">
          {state !== "collapsed" && (
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-fade-in">القائمة الرئيسية</SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="gap-1 px-2">
              {mainItems.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                      activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem style={{ animationDelay: `${mainItems.length * 30}ms` }} className="animate-fade-in">
                <SidebarMenuButton asChild isActive={isActive("/dashboard/analytics/advanced")}>
                  <NavLink
                    to="/dashboard/analytics/advanced"
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                    activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                  >
                    <BarChart className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                    {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">التحليلات المتقدمة</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem style={{ animationDelay: `${(mainItems.length + 1) * 30}ms` }} className="animate-fade-in">
                <SidebarMenuButton asChild isActive={isActive("/dashboard/gamification")}>
                  <NavLink
                    to="/dashboard/gamification"
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                    activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                  >
                    <Trophy className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                    {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">النقاط والشارات</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="py-4 transition-all duration-300 animate-fade-in">
            {state !== "collapsed" && (
              <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-fade-in">الإدارة</SidebarGroupLabel>
            )}
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="gap-1 px-2">
                <SidebarMenuItem className="animate-fade-in">
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/admin")}>
                    <NavLink
                      to="/dashboard/admin"
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                      activeClassName="bg-destructive/15 text-destructive font-bold border-r-4 border-destructive shadow-sm"
                    >
                      <Shield className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">لوحة الإدارة</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {adminItems.map((item, index) => (
                  <SidebarMenuItem key={item.title} style={{ animationDelay: `${(index + 1) * 30}ms` }} className="animate-fade-in">
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink
                         to={item.url}
                         className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                         activeClassName="bg-destructive/15 text-destructive font-bold border-r-4 border-destructive shadow-sm"
                       >
                        <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                        {state !== "collapsed" && (
                          <div className="flex items-center justify-between flex-1 transition-opacity duration-300">
                            <span className="text-sm">{item.title}</span>
                            {pendingReportsCount > 0 && (
                              <Badge variant="destructive" className="ml-auto animate-scale-in transition-transform duration-200 hover:scale-110">
                                {pendingReportsCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup className="py-4 transition-all duration-300">
          {state !== "collapsed" && (
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-fade-in">أخرى</SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="gap-1 px-2">
              {settingsItems.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
                      activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t transition-all duration-300">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:translate-x-1 hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
            {state !== "collapsed" && <span className="transition-opacity duration-300 animate-fade-in">تسجيل الخروج</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
