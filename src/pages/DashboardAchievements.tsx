import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  achievement_type: string;
  requirement_value: number;
  reward_points: number;
  is_active: boolean;
  is_repeatable: boolean;
}

const achievementTypes = [
  { value: "first_auction", label: "أول مزاد" },
  { value: "level_reached", label: "الوصول لمستوى معين" },
  { value: "total_bids", label: "إجمالي المزايدات" },
  { value: "total_sales", label: "إجمالي المبيعات" },
  { value: "points_milestone", label: "معلم النقاط" },
  { value: "total_listings", label: "إجمالي الإعلانات" },
];

const iconOptions = [
  "Trophy", "Award", "Medal", "Star", "Crown", "Gavel", "Package", 
  "TrendingUp", "ShoppingBag", "Target", "Zap", "Gift"
];

const DashboardAchievements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Trophy",
    achievement_type: "first_auction",
    requirement_value: "1",
    reward_points: "50",
    is_active: true,
    is_repeatable: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
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
        toast.error("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      setIsAdmin(true);
      await loadAchievements();
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const loadAchievements = async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("فشل تحميل الإنجازات");
      return;
    }

    setAchievements(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "Trophy",
      achievement_type: "first_auction",
      requirement_value: "1",
      reward_points: "50",
      is_active: true,
      is_repeatable: false,
    });
    setEditingAchievement(null);
  };

  const handleOpenDialog = (achievement?: Achievement) => {
    if (achievement) {
      setEditingAchievement(achievement);
      setFormData({
        name: achievement.name,
        description: achievement.description || "",
        icon: achievement.icon,
        achievement_type: achievement.achievement_type,
        requirement_value: achievement.requirement_value.toString(),
        reward_points: achievement.reward_points.toString(),
        is_active: achievement.is_active,
        is_repeatable: achievement.is_repeatable,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveAchievement = async () => {
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم الإنجاز");
      return;
    }

    const achievementData = {
      name: formData.name,
      description: formData.description || null,
      icon: formData.icon,
      achievement_type: formData.achievement_type,
      requirement_value: parseFloat(formData.requirement_value),
      reward_points: parseInt(formData.reward_points),
      is_active: formData.is_active,
      is_repeatable: formData.is_repeatable,
    };

    let error;
    if (editingAchievement) {
      const result = await supabase
        .from("achievements")
        .update(achievementData)
        .eq("id", editingAchievement.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("achievements")
        .insert(achievementData);
      error = result.error;
    }

    if (error) {
      toast.error("فشل حفظ الإنجاز");
      return;
    }

    toast.success(editingAchievement ? "تم تحديث الإنجاز بنجاح" : "تم إضافة الإنجاز بنجاح");
    setDialogOpen(false);
    resetForm();
    loadAchievements();
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) return;

    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("فشل حذف الإنجاز");
      return;
    }

    toast.success("تم حذف الإنجاز بنجاح");
    loadAchievements();
  };

  const handleToggleActive = async (achievement: Achievement) => {
    const { error } = await supabase
      .from("achievements")
      .update({ is_active: !achievement.is_active })
      .eq("id", achievement.id);

    if (error) {
      toast.error("فشل تحديث حالة الإنجاز");
      return;
    }

    toast.success(achievement.is_active ? "تم تعطيل الإنجاز" : "تم تفعيل الإنجاز");
    loadAchievements();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <header className="sticky top-0 z-10 bg-background border-b">
              <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <h1 className="text-2xl font-bold">إدارة المكافآت</h1>
              </div>
            </header>
            <main className="container mx-auto p-6 space-y-6">
              <Skeleton className="h-64 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">إدارة المكافآت والإنجازات</h1>
            </div>
          </header>
          <main className="container mx-auto p-6 space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">المكافآت التلقائية</h2>
                <p className="text-muted-foreground">إدارة الإنجازات والمكافآت التي يحصل عليها المستخدمون</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة إنجاز جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAchievement ? "تعديل الإنجاز" : "إضافة إنجاز جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      قم بإعداد الإنجاز والمكافأة المرتبطة به
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>اسم الإنجاز *</Label>
                        <Input
                          placeholder="مثال: أول مزاد"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الأيقونة</Label>
                        <Select
                          value={formData.icon}
                          onValueChange={(value) => setFormData({ ...formData, icon: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>الوصف</Label>
                      <Textarea
                        placeholder="وصف الإنجاز..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نوع الإنجاز *</Label>
                        <Select
                          value={formData.achievement_type}
                          onValueChange={(value) => setFormData({ ...formData, achievement_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {achievementTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>القيمة المطلوبة *</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={formData.requirement_value}
                          onChange={(e) => setFormData({ ...formData, requirement_value: e.target.value.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()) })}
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>نقاط المكافأة *</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={formData.reward_points}
                        onChange={(e) => setFormData({ ...formData, reward_points: e.target.value.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()) })}
                        min="1"
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>تفعيل الإنجاز</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_repeatable}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_repeatable: checked })}
                        />
                        <Label>قابل للتكرار</Label>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                      <Button onClick={handleSaveAchievement}>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">لا توجد إنجازات. قم بإضافة إنجاز جديد للبدء</p>
                  </CardContent>
                </Card>
              ) : (
                achievements.map((achievement) => (
                  <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Trophy className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{achievement.name}</CardTitle>
                              {!achievement.is_active && (
                                <Badge variant="secondary">معطل</Badge>
                              )}
                              {achievement.is_repeatable && (
                                <Badge variant="outline">قابل للتكرار</Badge>
                              )}
                            </div>
                            <CardDescription>{achievement.description}</CardDescription>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span>
                                النوع: {achievementTypes.find(t => t.value === achievement.achievement_type)?.label}
                              </span>
                              <span>•</span>
                              <span>القيمة المطلوبة: {achievement.requirement_value.toLocaleString("en-US")}</span>
                              <span>•</span>
                              <span className="text-green-600 font-semibold">
                                المكافأة: {achievement.reward_points.toLocaleString("en-US")} نقطة
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(achievement)}
                          >
                            <Switch checked={achievement.is_active} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(achievement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAchievement(achievement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardAchievements;
