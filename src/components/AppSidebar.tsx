import { LayoutDashboard, Heart, Settings, Package, TrendingUp, FileText, MessageCircle, LogOut, Shield, Trophy, BarChart, Gavel, TestTube, Megaphone, Image, UserCheck, Home, Users, FolderTree, ChevronUp, ChevronDown, Palette, Calculator, Award, BarChart3, UserPlus, Search, Mail, Bell, ShoppingBag, Truck, Store, LayoutGrid } from "lucide-react";
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
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard, showBadge: false },
  { title: "إعلاناتي", url: "/dashboard/listings", icon: Package, showBadge: false },
  { title: "المزادات", url: "/dashboard/auctions", icon: Gavel, showBadge: false },
  { title: "دعوة الأصدقاء", url: "/dashboard/referral", icon: UserPlus, showBadge: false },
  { title: "إحصائيات المزادات", url: "/dashboard/auction-analytics", icon: BarChart, showBadge: false },
  { title: "ملفي كمزايد", url: "/dashboard/bidder-profile", icon: Trophy, showBadge: false },
  { title: "الرسائل", url: "/messages", icon: MessageCircle, showBadge: true, badgeKey: "messages" },
  { title: "المفضلة", url: "/favorites", icon: Heart, showBadge: false },
  { title: "الإحصائيات", url: "/dashboard/analytics", icon: TrendingUp, showBadge: false },
  { title: "التقارير", url: "/dashboard/reports", icon: FileText, showBadge: false },
];

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
  { title: "اختبار الإشعارات", url: "/test-notifications", icon: TestTube },
];

const adminItems = [
  { title: "إدارة الأعضاء", url: "/dashboard/user-approvals", icon: UserCheck, showBadge: true, badgeKey: "users" },
  { title: "إدارة الأدوار والصلاحيات", url: "/dashboard/roles", icon: Users, showBadge: false },
  { title: "إدارة البلاغات", url: "/dashboard/reports/admin", icon: Shield, showBadge: true, badgeKey: "reports" },
  { title: "إدارة الإشعارات", url: "/dashboard/notifications", icon: Bell, showBadge: false },
  { title: "قوالب الإشعارات الأوتوماتيكية", url: "/dashboard/notification-templates", icon: Bell, showBadge: false },
  { title: "إدارة الفئات", url: "/dashboard/categories", icon: FolderTree, showBadge: false },
  { title: "إدارة الإحالات", url: "/dashboard/referral-stats", icon: BarChart3, showBadge: false },
  { title: "إدارة المكافآت", url: "/dashboard/achievements", icon: Trophy, showBadge: false },
  { title: "تقارير الإنجازات", url: "/dashboard/achievements-reports", icon: BarChart3, showBadge: false },
  { title: "احتساب النقاط", url: "/dashboard/points-calculation", icon: Calculator, showBadge: false },
  { title: "لوحة المتصدرين", url: "/dashboard/leaderboard", icon: Award, showBadge: false },
  { title: "إدارة SEO ومحركات البحث", url: "/dashboard/seo", icon: Search, showBadge: false },
  { title: "إدارة الصفحة الرئيسية", url: "/dashboard/homepage", icon: Home, showBadge: false },
  { title: "إدارة نموذج التسجيل", url: "/dashboard/auth-settings", icon: UserPlus, showBadge: false },
  { title: "إدارة البريد الإلكتروني", url: "/dashboard/email-settings", icon: Mail, showBadge: false },
  { title: "إدارة الشريط العلوي", url: "/dashboard/top-bar", icon: ChevronUp, showBadge: false },
  { title: "إدارة الفوتر", url: "/dashboard/footer", icon: ChevronDown, showBadge: false },
  { title: "إدارة ألوان الموقع", url: "/dashboard/theme", icon: Palette, showBadge: false },
  { title: "إدارة الإعلانات", url: "/dashboard/announcements", icon: Megaphone, showBadge: false },
  { title: "إدارة الـ Hero Carousel", url: "/dashboard/hero-carousel", icon: Image, showBadge: false },
  { title: "منتجات AliExpress", url: "/dashboard/aliexpress", icon: ShoppingBag, showBadge: false },
  { title: "منتجات CJdropshipping", url: "/dashboard/cjdropshipping", icon: Truck, showBadge: false },
  { title: "منتجات المتجر (Shopify)", url: "/dashboard/shopify-products", icon: Store, showBadge: false },
  { title: "إدارة الصفحات الفرعية", url: "/dashboard/static-pages", icon: FileText, showBadge: false },
  { title: "إدارة البنرات الترويجية", url: "/dashboard/promotional-banners", icon: LayoutGrid, showBadge: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    checkAdminStatus();
    fetchUnreadMessagesCount();
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
      fetchPendingUsersCount();
    }
  };

  const fetchPendingReportsCount = async () => {
    const { count, error } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && count !== null) {
      setPendingReportsCount(count);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // جلب المحادثات الخاصة بالمستخدم
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      
      // حساب عدد الرسائل غير المقروءة التي لم يرسلها المستخدم
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      if (count !== null) {
        setUnreadMessagesCount(count);
      }
    }
  };

  const fetchPendingUsersCount = async () => {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending");

    if (!error && count !== null) {
      setPendingUsersCount(count);
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
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                      activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                    >
                      {isActive(item.url) && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                      )}
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      {state !== "collapsed" && (
                        <div className="flex items-center justify-between flex-1 transition-opacity duration-300">
                          <span className="text-sm">{item.title}</span>
                          {item.showBadge && item.badgeKey === "messages" && unreadMessagesCount > 0 && (
                            <Badge variant="destructive" className="ml-auto animate-scale-in transition-transform duration-200 hover:scale-110">
                              {unreadMessagesCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem style={{ animationDelay: `${mainItems.length * 30}ms` }} className="animate-fade-in">
                <SidebarMenuButton asChild isActive={isActive("/dashboard/analytics/advanced")}>
                  <NavLink
                    to="/dashboard/analytics/advanced"
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                    activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                  >
                    {isActive("/dashboard/analytics/advanced") && (
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    )}
                    <BarChart className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                    {state !== "collapsed" && <span className="text-sm transition-opacity duration-300">التحليلات المتقدمة</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem style={{ animationDelay: `${(mainItems.length + 1) * 30}ms` }} className="animate-fade-in">
                <SidebarMenuButton asChild isActive={isActive("/dashboard/gamification")}>
                  <NavLink
                    to="/dashboard/gamification"
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                    activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                  >
                    {isActive("/dashboard/gamification") && (
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    )}
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
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                      activeClassName="bg-destructive/15 text-destructive font-bold border-r-4 border-destructive shadow-sm"
                    >
                      {isActive("/dashboard/admin") && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-lg shadow-destructive/50" />
                      )}
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
                         className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                         activeClassName="bg-destructive/15 text-destructive font-bold border-r-4 border-destructive shadow-sm"
                       >
                         {isActive(item.url) && (
                           <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-lg shadow-destructive/50" />
                         )}
                         <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                         {state !== "collapsed" && (
                           <div className="flex items-center justify-between flex-1 transition-opacity duration-300">
                             <span className="text-sm">{item.title}</span>
                             {item.showBadge && item.badgeKey === "users" && pendingUsersCount > 0 && (
                               <Badge variant="destructive" className="ml-auto animate-scale-in transition-transform duration-200 hover:scale-110">
                                 {pendingUsersCount}
                               </Badge>
                             )}
                             {item.showBadge && item.badgeKey === "reports" && pendingReportsCount > 0 && (
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
                      className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1 relative"
                      activeClassName="bg-primary/15 text-primary font-bold border-r-4 border-primary shadow-sm"
                    >
                      {isActive(item.url) && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                      )}
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
