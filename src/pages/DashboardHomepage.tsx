import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, GripVertical, RefreshCw, LayoutGrid, Megaphone, Gavel, Package, Settings2, History, RotateCcw, Home } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  is_visible: boolean;
  display_order: number;
  updated_at: string;
  items_limit: number;
  background_color: string;
  settings: Record<string, any>;
}

interface SectionHistory {
  id: string;
  section_id: string;
  changed_by: string | null;
  items_limit: number;
  background_color: string;
  is_visible: boolean;
  settings: Record<string, any>;
  created_at: string;
}

const sectionIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  hero: {
    icon: LayoutGrid,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  announcements: {
    icon: Megaphone,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  live_auctions: {
    icon: Gavel,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  featured_listings: {
    icon: Package,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

const backgroundColorOptions = [
  { value: "bg-white", label: "أبيض", preview: "#ffffff" },
  { value: "bg-gray-50", label: "رمادي فاتح", preview: "#f9fafb" },
  { value: "bg-gray-100", label: "رمادي", preview: "#f3f4f6" },
  { value: "bg-background", label: "خلفية افتراضية", preview: "#ffffff" },
  { value: "bg-slate-50", label: "سليت فاتح", preview: "#f8fafc" },
  { value: "bg-blue-50", label: "أزرق فاتح", preview: "#eff6ff" },
  { value: "bg-green-50", label: "أخضر فاتح", preview: "#f0fdf4" },
  { value: "bg-purple-50", label: "بنفسجي فاتح", preview: "#faf5ff" },
];

export default function DashboardHomepage() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    items_limit: 12,
    background_color: "bg-gray-50",
  });

  const { data: sections, isLoading } = useQuery({
    queryKey: ["homepage-sections", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as HomepageSection[];
    },
  });

  const { data: history } = useQuery({
    queryKey: ["section-history", editingSection?.id],
    queryFn: async () => {
      if (!editingSection?.id) return [];
      const { data, error } = await supabase
        .from("homepage_section_history")
        .select("*")
        .eq("section_id", editingSection.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SectionHistory[];
    },
    enabled: !!editingSection?.id && isHistoryDialogOpen,
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<HomepageSection>;
    }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({ ...updates, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success("تم تحديث القسم بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث القسم");
    },
  });

  const handleToggleVisibility = (id: string, currentVisibility: boolean) => {
    updateSectionMutation.mutate({ id, updates: { is_visible: !currentVisibility } });
  };

  const handleOpenSettings = (section: HomepageSection) => {
    setEditingSection(section);
    setSettingsForm({
      items_limit: section.items_limit,
      background_color: section.background_color,
    });
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    if (!editingSection) return;
    
    updateSectionMutation.mutate({
      id: editingSection.id,
      updates: settingsForm,
    });
    setIsSettingsDialogOpen(false);
    setEditingSection(null);
  };

  const handleRefreshPreview = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("تم تحديث المعاينة");
  };

  const handleOpenHistory = (section: HomepageSection) => {
    setEditingSection(section);
    setIsHistoryDialogOpen(true);
  };

  const restoreHistoryMutation = useMutation({
    mutationFn: async (historyItem: SectionHistory) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          items_limit: historyItem.items_limit,
          background_color: historyItem.background_color,
          is_visible: historyItem.is_visible,
          settings: historyItem.settings,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", historyItem.section_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success("تم استعادة الإعدادات بنجاح");
      setIsHistoryDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء استعادة الإعدادات");
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <div className="p-8 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">جاري تحميل الأقسام...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <Home className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة الصفحة الرئيسية</h1>
            </div>
          </header>
          <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            تحكم في إظهار وإخفاء أقسام الصفحة الرئيسية
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshPreview}>
          <RefreshCw className="w-4 h-4 mr-2" />
          تحديث المعاينة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
        {sections?.map((section) => {
          const sectionConfig = sectionIcons[section.section_key] || {
            icon: LayoutGrid,
            color: "text-gray-600",
            bgColor: "bg-gray-50",
          };
          const IconComponent = sectionConfig.icon;
          
          return (
            <Card 
              key={section.id} 
              className={`relative transition-all duration-300 hover:shadow-lg ${
                section.is_visible ? "border-primary/20" : "border-muted"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${sectionConfig.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${sectionConfig.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {section.section_name}
                        {section.is_visible && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                            نشط
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {section.section_key}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {section.is_visible ? (
                      <>
                        <Eye className="w-5 h-5 text-green-500" />
                        <Label
                          htmlFor={`section-${section.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          القسم ظاهر للزوار
                        </Label>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-5 h-5 text-gray-400" />
                        <Label
                          htmlFor={`section-${section.id}`}
                          className="text-sm font-medium cursor-pointer text-muted-foreground"
                        >
                          القسم مخفي
                        </Label>
                      </>
                    )}
                  </div>
                  <Switch
                    id={`section-${section.id}`}
                    checked={section.is_visible}
                    onCheckedChange={() =>
                      handleToggleVisibility(section.id, section.is_visible)
                    }
                  />
                </div>

                {/* Additional Settings Info */}
                <div className="space-y-2 p-3 bg-muted/20 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">عدد العناصر:</span>
                    <span className="font-medium">{section.items_limit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">لون الخلفية:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border ${section.background_color}`}></div>
                      <span className="font-medium text-xs">{section.background_color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenSettings(section)}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    إعدادات
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenHistory(section)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    السجل
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    آخر تحديث:{" "}
                    {new Date(section.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات القسم: {editingSection?.section_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Items Limit */}
            {(editingSection?.section_key === "live_auctions" || 
              editingSection?.section_key === "featured_listings") && (
              <div className="space-y-2">
                <Label htmlFor="items_limit">عدد العناصر المعروضة</Label>
                <Input
                  id="items_limit"
                  type="number"
                  min="1"
                  max="50"
                  value={settingsForm.items_limit}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      items_limit: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  عدد {editingSection?.section_key === "live_auctions" ? "المزادات" : "الإعلانات"} التي سيتم عرضها في هذا القسم
                </p>
              </div>
            )}

            {/* Background Color */}
            <div className="space-y-3">
              <Label>لون الخلفية</Label>
              <div className="grid grid-cols-2 gap-3">
                {backgroundColorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSettingsForm({
                        ...settingsForm,
                        background_color: option.value,
                      })
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      settingsForm.background_color === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded border-2 ${option.value}`}
                      style={{ backgroundColor: option.preview }}
                    ></div>
                    <div className="text-right flex-1">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.value}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>معاينة</Label>
              <div className={`p-6 rounded-lg border-2 ${settingsForm.background_color}`}>
                <p className="text-sm text-center text-muted-foreground">
                  معاينة القسم بالإعدادات الجديدة
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveSettings} className="flex-1">
              حفظ التغييرات
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsSettingsDialogOpen(false);
                setEditingSection(null);
              }}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>سجل التغييرات: {editingSection?.section_name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <History className="w-4 h-4" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">الحالة: </span>
                            <span className={item.is_visible ? "text-green-600" : "text-gray-500"}>
                              {item.is_visible ? "ظاهر" : "مخفي"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">عدد العناصر: </span>
                            <span className="font-medium">{item.items_limit}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">لون الخلفية: </span>
                            <div className="inline-flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border ${item.background_color}`}></div>
                              <span className="font-medium text-xs">{item.background_color}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreHistoryMutation.mutate(item)}
                        disabled={restoreHistoryMutation.isPending}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        استعادة
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <History className="w-12 h-12 mb-2 opacity-50" />
                <p>لا يوجد سجل تغييرات لهذا القسم</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Card className="mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle>ملاحظات هامة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• التغييرات تطبق فوراً على الصفحة الرئيسية</p>
          <p>• يمكنك إظهار أو إخفاء أي قسم من الصفحة</p>
          <p>• القسم المخفي لن يظهر للزوار</p>
          <p>• يمكنك التراجع عن التغييرات في أي وقت</p>
        </CardContent>
      </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
