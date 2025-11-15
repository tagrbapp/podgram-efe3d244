import { LayoutDashboard, Heart, Settings, Package, TrendingUp, FileText, MessageCircle, LogOut, Shield, Trophy, BarChart, Gavel } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const mainItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "إعلاناتي", url: "/dashboard/listings", icon: Package },
  { title: "المزادات", url: "/dashboard/auctions", icon: Gavel },
  { title: "الرسائل", url: "/messages", icon: MessageCircle },
  { title: "المفضلة", url: "/favorites", icon: Heart },
  { title: "الإحصائيات", url: "/dashboard/analytics", icon: TrendingUp },
  { title: "التقارير", url: "/dashboard/reports", icon: FileText },
];

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "إدارة البلاغات", url: "/dashboard/reports/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} side="right">
      <SidebarContent className="bg-card border-l">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-xl font-bold text-primary-foreground">MQ</span>
            </div>
            {state !== "collapsed" && (
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                مك
              </span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/analytics/advanced")}>
                  <NavLink
                    to="/dashboard/analytics/advanced"
                    className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <BarChart className="h-5 w-5" />
                    {state !== "collapsed" && <span>التحليلات المتقدمة</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/gamification")}>
                  <NavLink
                    to="/dashboard/gamification"
                    className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Trophy className="h-5 w-5" />
                    {state !== "collapsed" && <span>النقاط والشارات</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/admin")}>
                    <NavLink
                      to="/dashboard/admin"
                      className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <Shield className="h-5 w-5" />
                      {state !== "collapsed" && <span>لوحة الإدارة</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        {state !== "collapsed" && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.url === "/dashboard/reports/admin" && pendingReportsCount > 0 && (
                              <Badge variant="destructive" className="mr-auto">
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
        <SidebarGroup>
          <SidebarGroupLabel>الإعدادات</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {state !== "collapsed" && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
