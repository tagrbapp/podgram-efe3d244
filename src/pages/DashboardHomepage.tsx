import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, GripVertical, RefreshCw } from "lucide-react";

interface HomepageSection {
  id: string;
  section_key: string;
  section_name: string;
  is_visible: boolean;
  display_order: number;
  updated_at: string;
}

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 max-w-3xl">
        {sections?.map((section) => (
          <Card key={section.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{section.section_name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {section.section_key}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {section.is_visible ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`section-${section.id}`}
                  className="text-sm font-medium"
                >
                  {section.is_visible ? "ظاهر" : "مخفي"}
                </Label>
                <Switch
                  id={`section-${section.id}`}
                  checked={section.is_visible}
                  onCheckedChange={() =>
                    handleToggleVisibility(section.id, section.is_visible)
                  }
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                آخر تحديث:{" "}
                {new Date(section.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </CardContent>
          </Card>
        ))}
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
