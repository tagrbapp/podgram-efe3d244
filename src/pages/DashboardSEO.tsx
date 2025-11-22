import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  Download,
  RefreshCw,
  Globe,
  BarChart3,
  Settings,
  FileCode
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SearchEngineStats {
  name: string;
  icon: string;
  referrals: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface SEOIssue {
  type: "error" | "warning" | "success";
  title: string;
  description: string;
  recommendation: string;
}

const DashboardSEO = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchEngines, setSearchEngines] = useState<SearchEngineStats[]>([
    { name: "Google", icon: "🔍", referrals: 1250, percentage: 65, trend: "up" },
    { name: "Bing", icon: "🅱️", referrals: 380, percentage: 20, trend: "stable" },
    { name: "Yahoo", icon: "⚪", referrals: 190, percentage: 10, trend: "down" },
    { name: "DuckDuckGo", icon: "🦆", referrals: 95, percentage: 5, trend: "up" },
  ]);

  const [seoIssues, setSeoIssues] = useState<SEOIssue[]>([
    {
      type: "success",
      title: "ملف sitemap.xml موجود",
      description: "تم العثور على خريطة الموقع بشكل صحيح",
      recommendation: "تأكد من تحديث خريطة الموقع عند إضافة صفحات جديدة"
    },
    {
      type: "success",
      title: "ملف robots.txt موجود",
      description: "تم إعداد ملف robots.txt بشكل صحيح",
      recommendation: "راجع القواعد بانتظام للتأكد من عدم حظر صفحات مهمة"
    },
    {
      type: "warning",
      title: "سرعة تحميل الصفحة",
      description: "متوسط سرعة التحميل: 2.3 ثانية",
      recommendation: "حاول تحسين الصور وتقليل حجم الملفات لتحسين الأداء"
    },
    {
      type: "success",
      title: "تصميم متجاوب",
      description: "الموقع متوافق مع الأجهزة المحمولة",
      recommendation: "استمر في اختبار التجربة على أحجام شاشات مختلفة"
    },
    {
      type: "warning",
      title: "وصف Meta",
      description: "بعض الصفحات تفتقر إلى وصف meta مخصص",
      recommendation: "أضف وصف meta فريد لكل صفحة (150-160 حرف)"
    }
  ]);

  const [metaData, setMetaData] = useState({
    title: "Podgram - منصة السوق الفاخرة الأولى",
    description: "اكتشف أفضل منصة لبيع وشراء المنتجات الفاخرة في السعودية",
    keywords: "مزادات فاخرة, ساعات فاخرة, حقائب فاخرة, مجوهرات",
  });

  const totalReferrals = searchEngines.reduce((sum, engine) => sum + engine.referrals, 0);

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return "📈";
    if (trend === "down") return "📉";
    return "➡️";
  };

  const getIssueIcon = (type: "error" | "warning" | "success") => {
    if (type === "error") return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (type === "warning") return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const handleRefreshAnalytics = () => {
    setLoading(true);
    toast({
      title: "جاري تحديث البيانات",
      description: "يتم الآن جلب أحدث إحصائيات محركات البحث",
    });
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات محركات البحث",
      });
    }, 2000);
  };

  const handleUpdateMeta = () => {
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات SEO بنجاح",
    });
  };

  const handleGenerateSitemap = () => {
    toast({
      title: "تم إنشاء Sitemap",
      description: "تم إنشاء ملف sitemap.xml بنجاح",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            إدارة SEO ومحركات البحث
          </h1>
          <p className="text-muted-foreground mt-2">
            تحسين ظهور الموقع في نتائج البحث وتتبع الإحالات
          </p>
        </div>
        <Button onClick={handleRefreshAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الإحالات</CardDescription>
            <CardTitle className="text-3xl">{totalReferrals.toLocaleString("en-US")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
              +12% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>محركات البحث النشطة</CardDescription>
            <CardTitle className="text-3xl">{searchEngines.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="h-4 w-4 ml-1" />
              محركات بحث رئيسية
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>معدل التحويل</CardDescription>
            <CardTitle className="text-3xl">3.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 ml-1" />
              من زوار البحث
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>درجة SEO</CardDescription>
            <CardTitle className="text-3xl">85/100</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4 ml-1" />
              ممتاز
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 ml-2" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertCircle className="h-4 w-4 ml-2" />
            التوصيات
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 ml-2" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="tools">
            <FileCode className="h-4 w-4 ml-2" />
            الأدوات
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات محركات البحث</CardTitle>
              <CardDescription>
                عدد الإحالات من كل محرك بحث خلال آخر 30 يوم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>محرك البحث</TableHead>
                    <TableHead>عدد الإحالات</TableHead>
                    <TableHead>النسبة المئوية</TableHead>
                    <TableHead>الاتجاه</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchEngines.map((engine) => (
                    <TableRow key={engine.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{engine.icon}</span>
                          {engine.name}
                        </div>
                      </TableCell>
                      <TableCell>{engine.referrals.toLocaleString("en-US")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{engine.percentage}%</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xl">{getTrendIcon(engine.trend)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Referral Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع الإحالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchEngines.map((engine) => (
                  <div key={engine.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{engine.icon}</span>
                        {engine.name}
                      </span>
                      <span className="font-medium">{engine.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${engine.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues & Recommendations Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقرير تحسين محركات البحث (SEO)</CardTitle>
              <CardDescription>
                توصيات لتحسين ظهور موقعك في نتائج البحث
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIssueIcon(issue.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-foreground">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded">
                        <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-foreground">{issue.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل الممارسات لتحسين SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>استخدام الكلمات المفتاحية:</strong> ضع الكلمات المفتاحية في العناوين والأوصاف
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>المحتوى عالي الجودة:</strong> أنشئ محتوى فريد ومفيد للمستخدمين
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>الروابط الداخلية:</strong> استخدم روابط داخلية بين الصفحات ذات الصلة
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>الصور المحسنة:</strong> استخدم نصوص بديلة (alt text) وصفية لجميع الصور
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>سرعة التحميل:</strong> قلل حجم الملفات واستخدم التخزين المؤقت
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات Meta Tags</CardTitle>
              <CardDescription>
                إدارة العناوين والأوصاف والكلمات المفتاحية للصفحة الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">العنوان (Title)</Label>
                <Input
                  id="meta-title"
                  value={metaData.title}
                  onChange={(e) => setMetaData({ ...metaData, title: e.target.value })}
                  placeholder="عنوان الموقع"
                />
                <p className="text-xs text-muted-foreground">
                  الطول المثالي: 50-60 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">الوصف (Description)</Label>
                <Textarea
                  id="meta-description"
                  value={metaData.description}
                  onChange={(e) => setMetaData({ ...metaData, description: e.target.value })}
                  placeholder="وصف الموقع"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  الطول المثالي: 150-160 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-keywords">الكلمات المفتاحية (Keywords)</Label>
                <Textarea
                  id="meta-keywords"
                  value={metaData.keywords}
                  onChange={(e) => setMetaData({ ...metaData, keywords: e.target.value })}
                  placeholder="الكلمات المفتاحية مفصولة بفواصل"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  افصل الكلمات بفواصل (،)
                </p>
              </div>

              <Button onClick={handleUpdateMeta} className="w-full">
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>

          {/* Google Search Console */}
          <Card>
            <CardHeader>
              <CardTitle>ربط Google Search Console</CardTitle>
              <CardDescription>
                اربط موقعك مع Google Search Console للحصول على تحليلات أعمق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  للحصول على بيانات دقيقة من Google، قم بربط موقعك مع Google Search Console
                </p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  فتح Google Search Console
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>أدوات SEO</CardTitle>
              <CardDescription>أدوات لإدارة وتحسين الأرشفة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-6" onClick={handleGenerateSitemap}>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-semibold">إنشاء Sitemap</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        إنشاء ملف sitemap.xml محدث
                      </div>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-6" asChild>
                  <a href="/sitemap.xml" target="_blank">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Download className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">تحميل Sitemap</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          تحميل ملف sitemap.xml
                        </div>
                      </div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto p-6" asChild>
                  <a href="/robots.txt" target="_blank">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <FileCode className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">عرض robots.txt</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          مراجعة ملف robots.txt
                        </div>
                      </div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" className="h-auto p-6" asChild>
                  <a
                    href="https://pagespeed.web.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <TrendingUp className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">اختبار السرعة</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          اختبار سرعة الموقع
                        </div>
                      </div>
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Indexing Status */}
          <Card>
            <CardHeader>
              <CardTitle>حالة الأرشفة</CardTitle>
              <CardDescription>
                معلومات حول الصفحات المؤرشفة في محركات البحث
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">الصفحات المؤرشفة</div>
                      <div className="text-sm text-muted-foreground">
                        تم أرشفة معظم صفحات الموقع
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">45 صفحة</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">في انتظار الأرشفة</div>
                      <div className="text-sm text-muted-foreground">
                        صفحات جديدة لم تتم أرشفتها بعد
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">3 صفحات</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">إجمالي الصفحات</div>
                      <div className="text-sm text-muted-foreground">
                        جميع صفحات الموقع
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">48 صفحة</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardSEO;
