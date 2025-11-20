import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, GripVertical, RefreshCw, LayoutGrid, Megaphone, Gavel, Package } from "lucide-react";

interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  is_visible: boolean;
  display_order: number;
  updated_at: string;
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

export default function DashboardHomepage() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

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
      is_visible,
    }: {
      id: string;
      is_visible: boolean;
    }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({ is_visible, updated_by: (await supabase.auth.getUser()).data.user?.id })
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
    updateSectionMutation.mutate({ id, is_visible: !currentVisibility });
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
