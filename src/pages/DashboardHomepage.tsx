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
import { Eye, EyeOff, GripVertical, RefreshCw, LayoutGrid, Megaphone, Gavel, Package, Settings2 } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الصفحة الرئيسية</h1>
          <p className="text-muted-foreground mt-2">
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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOpenSettings(section)}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  إعدادات متقدمة
                </Button>

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
    </div>
  );
}
