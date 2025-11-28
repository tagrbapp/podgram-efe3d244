import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Edit, Eye, Filter, Code, Save, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

interface NotificationTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  title_template: string;
  message_template: string;
  type: string;
  is_active: boolean;
  category: string;
  variables: any; // Changed from string[] to any to handle Json type
  created_at: string;
  updated_at: string;
}

const DashboardNotificationTemplates = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ title: "", message: "" });
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    checkUser();
    fetchTemplates();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    setUser(session.user);
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("فشل جلب القوالب");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from("notification_templates")
        .update({
          name: editingTemplate.name,
          description: editingTemplate.description,
          title_template: editingTemplate.title_template,
          message_template: editingTemplate.message_template,
          is_active: editingTemplate.is_active,
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast.success("تم تحديث القالب");
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("فشل تحديث القالب");
    }
  };

  const handlePreview = (template: NotificationTemplate) => {
    // Replace variables with example data
    let previewTitle = template.title_template;
    let previewMessage = template.message_template;

    const exampleData: { [key: string]: string } = {
      user_name: "أحمد محمد",
      bidder_name: "محمد علي",
      bid_amount: "5000",
      listing_title: "ساعة رولكس",
      rating: "5",
      seller_name: "فاطمة أحمد",
      reporter_name: "خالد السعيد",
      reason: "محتوى غير مناسب",
      new_user_name: "سارة أحمد",
      level: "5",
      achievement_name: "البائع الماهر",
      points: "100",
      badge_name: "البائع المميز",
      final_price: "7500",
      winner_name: "عمر محمود",
      auction_title: "سيارة BMW",
      sender_name: "ليلى حسن",
    };

    const variables = Array.isArray(template.variables) ? template.variables : [];
    variables.forEach((varName: any) => {
      const varString = String(varName);
      const exampleValue = exampleData[varString] || `[${varString}]`;
      previewTitle = previewTitle.replace(`{{${varString}}}`, exampleValue);
      previewMessage = previewMessage.replace(`{{${varString}}}`, exampleValue);
    });

    setPreviewData({ title: previewTitle, message: previewMessage });
    setIsPreviewDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      auction: "المزادات",
      user: "المستخدم",
      admin: "الإدارة",
      system: "النظام",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      auction: "bg-blue-500",
      user: "bg-green-500",
      admin: "bg-red-500",
      system: "bg-purple-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const filteredTemplates = templates.filter((template) => {
    const categoryMatch = filterCategory === "all" || template.category === filterCategory;
    const searchMatch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.template_key.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as { [key: string]: NotificationTemplate[] });

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Navbar />
          <main className="container mx-auto px-4 py-8 mt-20" dir="rtl">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-2xl">قوالب الإشعارات الأوتوماتيكية</CardTitle>
                      <CardDescription className="mt-2">
                        إدارة وتخصيص قوالب الإشعارات التي يتم إرسالها تلقائياً
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {templates.length} قالب
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* الفلاتر */}
                <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="ابحث في القوالب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-right"
                      />
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        <SelectItem value="auction">المزادات</SelectItem>
                        <SelectItem value="user">المستخدم</SelectItem>
                        <SelectItem value="admin">الإدارة</SelectItem>
                        <SelectItem value="system">النظام</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchQuery || filterCategory !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterCategory("all");
                        }}
                      >
                        مسح الفلاتر
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    عرض {filteredTemplates.length} من {templates.length} قالب
                  </div>
                </div>

                {/* القوالب المجمعة حسب الفئة */}
                <Tabs defaultValue={Object.keys(groupedTemplates)[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    {Object.keys(groupedTemplates).map((category) => (
                      <TabsTrigger key={category} value={category} className="gap-2">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
                        {getCategoryLabel(category)} ({groupedTemplates[category].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <TabsContent key={category} value={category}>
                      <div className="space-y-4">
                        {categoryTemplates.map((template) => (
                          <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold">{template.name}</h3>
                                    <Badge
                                      variant={template.is_active ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {template.is_active ? "مفعّل" : "معطّل"}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      <Code className="h-3 w-3 ml-1" />
                                      {template.template_key}
                                    </Badge>
                                  </div>
                                  {template.description && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {template.description}
                                    </p>
                                  )}
                                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground">
                                        العنوان:
                                      </span>
                                      <p className="text-sm mt-1">{template.title_template}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground">
                                        الرسالة:
                                      </span>
                                      <p className="text-sm mt-1">{template.message_template}</p>
                                    </div>
                                  </div>
                                  {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                      <span className="text-xs font-semibold text-muted-foreground">
                                        المتغيرات:
                                      </span>
                                      {template.variables.map((variable: any) => (
                                        <Badge key={String(variable)} variant="secondary" className="text-xs">
                                          {`{{${String(variable)}}}`}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreview(template)}
                                  >
                                    <Eye className="h-4 w-4 ml-2" />
                                    معاينة
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingTemplate(template);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 ml-2" />
                                    تعديل
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Dialog للتعديل */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>تعديل قالب الإشعار</DialogTitle>
                  <DialogDescription>
                    قم بتعديل محتوى القالب. استخدم {`{{variable_name}}`} للمتغيرات الديناميكية
                  </DialogDescription>
                </DialogHeader>
                {editingTemplate && (
                  <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-right block">اسم القالب</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, name: e.target.value })
                      }
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">الوصف</Label>
                    <Textarea
                      value={editingTemplate.description || ""}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          description: e.target.value,
                        })
                      }
                      className="text-right"
                      dir="rtl"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">قالب العنوان</Label>
                    <Input
                      value={editingTemplate.title_template}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          title_template: e.target.value,
                        })
                      }
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">قالب الرسالة</Label>
                    <Textarea
                      value={editingTemplate.message_template}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          message_template: e.target.value,
                        })
                      }
                      className="text-right"
                      dir="rtl"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg" dir="rtl">
                    <Label htmlFor="is-active" className="cursor-pointer">
                      تفعيل القالب
                    </Label>
                    <Switch
                      id="is-active"
                      checked={editingTemplate.is_active}
                      onCheckedChange={(checked) =>
                        setEditingTemplate({ ...editingTemplate, is_active: checked })
                      }
                    />
                  </div>

                    {editingTemplate.variables && Array.isArray(editingTemplate.variables) && editingTemplate.variables.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-semibold mb-2">المتغيرات المتاحة:</p>
                        <div className="flex flex-wrap gap-2">
                          {editingTemplate.variables.map((variable: any) => (
                            <Badge key={String(variable)} variant="secondary">
                              {`{{${String(variable)}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    <X className="h-4 w-4 ml-2" />
                    إلغاء
                  </Button>
                  <Button onClick={handleUpdate}>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog للمعاينة */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>معاينة الإشعار</DialogTitle>
                  <DialogDescription>
                    هكذا سيظهر الإشعار للمستخدم (مع بيانات تجريبية)
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{previewData.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{previewData.message}</p>
                    <p className="text-xs text-muted-foreground">منذ دقائق</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsPreviewDialogOpen(false)}>إغلاق</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardNotificationTemplates;