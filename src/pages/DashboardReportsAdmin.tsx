import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ReportCard } from "@/components/admin/ReportCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  listing_id: string | null;
  reporter: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  reported_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  listing?: {
    title: string;
  } | null;
}

const DashboardReportsAdmin = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
    fetchReports();
    subscribeToReports();
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data) {
        setReports([]);
        return;
      }

      // جلب بيانات المستخدمين
      const reporterIds = data.map(r => r.reporter_id);
      const reportedUserIds = data.map(r => r.reported_user_id);
      const listingIds = data.filter(r => r.listing_id).map(r => r.listing_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", [...reporterIds, ...reportedUserIds]);

      const { data: listings } = listingIds.length > 0 
        ? await supabase
            .from("listings")
            .select("id, title")
            .in("id", listingIds)
        : { data: [] };

      const profilesMap: Map<string, { id: string; full_name: string; avatar_url: string | null }> = 
        new Map(profiles?.map(p => [p.id, p]) || []);
      
      const listingsMap: Map<string, { title: string }> = new Map();
      if (listings && listings.length > 0) {
        listings.forEach(l => {
          listingsMap.set(l.id, { title: l.title });
        });
      }

      const enrichedReports = data.map(report => ({
        ...report,
        reporter: profilesMap.get(report.reporter_id) || { id: report.reporter_id, full_name: "مستخدم", avatar_url: null },
        reported_user: profilesMap.get(report.reported_user_id) || { id: report.reported_user_id, full_name: "مستخدم", avatar_url: null },
        listing: report.listing_id ? (listingsMap.get(report.listing_id) || null) : null
      })) as Report[];

      setReports(enrichedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToReports = () => {
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: string) => {
    return reports.filter((r) => r.status === status).length;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إدارة البلاغات</h1>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-muted-foreground mb-1">معلقة</p>
              <p className="text-2xl font-bold text-yellow-600">{getStatusCount("pending")}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-lg border border-blue-500/20">
              <p className="text-sm text-muted-foreground mb-1">قيد المراجعة</p>
              <p className="text-2xl font-bold text-blue-600">{getStatusCount("reviewed")}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">تم الحل</p>
              <p className="text-2xl font-bold text-green-600">{getStatusCount("resolved")}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-lg border border-red-500/20">
              <p className="text-sm text-muted-foreground mb-1">مرفوضة</p>
              <p className="text-2xl font-bold text-red-600">{getStatusCount("rejected")}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في البلاغات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="reviewed">قيد المراجعة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="rejected">مرفوضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">لا توجد بلاغات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
          <ReportCard key={report.id} report={report} onUpdate={fetchReports} />
        ))}
      </div>
        )}
          </main>
        </div>
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
};

export default DashboardReportsAdmin;
