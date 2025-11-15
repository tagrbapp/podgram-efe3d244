import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { FileText, Download, Calendar, TrendingUp, Package, Eye, DollarSign } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  views: number;
  created_at: string;
  categories: {
    name: string;
  } | null;
}

interface Profile {
  full_name: string;
  phone: string | null;
}

const DashboardReports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadData(user.id);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadData(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [selectedMonth, selectedYear, user]);

  const loadData = async (userId: string) => {
    setIsLoading(true);

    // جلب بيانات المستخدم
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // حساب تاريخ البداية والنهاية للشهر المحدد
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // جلب الإعلانات
    const { data: listingsData, error } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        status,
        views,
        created_at,
        categories (
          name
        )
      `)
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب البيانات");
      setIsLoading(false);
      return;
    }

    setListings(listingsData || []);
    setIsLoading(false);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // إعداد الخط العربي (استخدام خط افتراضي يدعم العربية)
    doc.setFont("helvetica");
    
    // العنوان
    doc.setFontSize(20);
    const monthName = new Date(parseInt(selectedYear), parseInt(selectedMonth)).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
    doc.text(`MQ - `, 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.text(`${monthName}`, 105, 30, { align: "center" });
    
    // معلومات المستخدم
    doc.setFontSize(12);
    doc.text(`${profile?.full_name || ""}`, 20, 45);
    doc.text(`${user?.email || ""}`, 20, 52);
    if (profile?.phone) {
      doc.text(`${profile.phone}`, 20, 59);
    }

    // الإحصائيات الرئيسية
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === "active").length;
    const soldListings = listings.filter(l => l.status === "sold").length;
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalRevenue = listings.filter(l => l.status === "sold").reduce((sum, l) => sum + l.price, 0);

    doc.setFontSize(14);
    doc.text("Statistics Summary", 20, 75);
    doc.setFontSize(11);
    
    const stats = [
      ["Total Listings", totalListings.toString()],
      ["Active Listings", activeListings.toString()],
      ["Sold Listings", soldListings.toString()],
      ["Total Views", totalViews.toString()],
      ["Total Revenue (SAR)", totalRevenue.toLocaleString('ar-SA')],
    ];

    autoTable(doc, {
      startY: 80,
      head: [["Metric", "Value"]],
      body: stats,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    // جدول الإعلانات
    if (listings.length > 0) {
      doc.setFontSize(14);
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      doc.text("Listings Details", 20, finalY + 10);

      const listingsData = listings.map(l => [
        l.title.substring(0, 30) + (l.title.length > 30 ? "..." : ""),
        l.price.toLocaleString('ar-SA'),
        l.categories?.name || "N/A",
        l.status === "active" ? "Active" : l.status === "sold" ? "Sold" : "Inactive",
        (l.views || 0).toString(),
        new Date(l.created_at).toLocaleDateString('ar-SA')
      ]);

      autoTable(doc, {
        startY: finalY + 15,
        head: [["Title", "Price (SAR)", "Category", "Status", "Views", "Date"]],
        body: listingsData,
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15 },
          5: { cellWidth: 30 },
        },
      });
    }

    // تذييل
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('ar-SA')}`,
        20,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // حفظ الملف
    const fileName = `MQ-Report-${selectedYear}-${parseInt(selectedMonth) + 1}.pdf`;
    doc.save(fileName);
    toast.success("تم تصدير التقرير بنجاح!");
  };

  const months = [
    { value: "0", label: "يناير" },
    { value: "1", label: "فبراير" },
    { value: "2", label: "مارس" },
    { value: "3", label: "أبريل" },
    { value: "4", label: "مايو" },
    { value: "5", label: "يونيو" },
    { value: "6", label: "يوليو" },
    { value: "7", label: "أغسطس" },
    { value: "8", label: "سبتمبر" },
    { value: "9", label: "أكتوبر" },
    { value: "10", label: "نوفمبر" },
    { value: "11", label: "ديسمبر" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === "active").length;
  const soldListings = listings.filter(l => l.status === "sold").length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalRevenue = listings.filter(l => l.status === "sold").reduce((sum, l) => sum + l.price, 0);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-lg">جاري التحميل...</p>
            </div>
          </div>
          <div className="order-1">
            <AppSidebar />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">التقارير الشهرية</h1>
                <p className="text-sm text-muted-foreground">عرض وتصدير التقارير الشهرية</p>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {/* اختيار الفترة */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">اختر الفترة</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="month">الشهر</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">السنة</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={generatePDF} 
                    className="w-full gap-2 bg-gradient-secondary hover:opacity-90 transition-smooth"
                    disabled={listings.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    تصدير PDF
                  </Button>
                </div>
              </div>
            </Card>

            {/* ملخص الإحصائيات */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإعلانات</p>
                    <p className="text-2xl font-bold">{totalListings}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات النشطة</p>
                    <p className="text-2xl font-bold">{activeListings}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات المباعة</p>
                    <p className="text-2xl font-bold">{soldListings}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المشاهدات</p>
                    <p className="text-2xl font-bold">{totalViews}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold">{totalRevenue.toLocaleString('ar-SA')} ر.س</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* جدول الإعلانات */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">تفاصيل الإعلانات</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">لا توجد إعلانات في هذه الفترة</p>
                  <p className="text-sm text-muted-foreground mt-2">اختر شهر آخر للعرض</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-3 text-sm font-medium">العنوان</th>
                        <th className="text-right p-3 text-sm font-medium">السعر</th>
                        <th className="text-right p-3 text-sm font-medium">الفئة</th>
                        <th className="text-right p-3 text-sm font-medium">الحالة</th>
                        <th className="text-right p-3 text-sm font-medium">المشاهدات</th>
                        <th className="text-right p-3 text-sm font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 text-sm">{listing.title}</td>
                          <td className="p-3 text-sm">{listing.price.toLocaleString('ar-SA')} ر.س</td>
                          <td className="p-3 text-sm">{listing.categories?.name || "غير محدد"}</td>
                          <td className="p-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              listing.status === "active" 
                                ? "bg-green-500/10 text-green-600" 
                                : listing.status === "sold"
                                ? "bg-purple-500/10 text-purple-600"
                                : "bg-gray-500/10 text-gray-600"
                            }`}>
                              {listing.status === "active" ? "نشط" : listing.status === "sold" ? "مباع" : "غير نشط"}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{listing.views || 0}</td>
                          <td className="p-3 text-sm">{new Date(listing.created_at).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardReports;
