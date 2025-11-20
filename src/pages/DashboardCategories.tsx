import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  created_at: string;
}

const DashboardCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "" });

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast.error("غير مصرح لك بالوصول لهذه الصفحة");
      navigate("/");
      return;
    }

    fetchCategories();
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("حدث خطأ في تحميل الفئات");
      console.error(error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.icon.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .insert([{ name: formData.name, icon: formData.icon }]);

    if (error) {
      toast.error("حدث خطأ في إضافة الفئة");
      console.error(error);
    } else {
      toast.success("تم إضافة الفئة بنجاح");
      setIsAddDialogOpen(false);
      setFormData({ name: "", icon: "" });
      fetchCategories();
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.name.trim() || !formData.icon.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .update({ name: formData.name, icon: formData.icon })
      .eq("id", selectedCategory.id);

    if (error) {
      toast.error("حدث خطأ في تعديل الفئة");
      console.error(error);
    } else {
      toast.success("تم تعديل الفئة بنجاح");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setFormData({ name: "", icon: "" });
      fetchCategories();
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", selectedCategory.id);

    if (error) {
      toast.error("حدث خطأ في حذف الفئة");
      console.error(error);
    } else {
      toast.success("تم حذف الفئة بنجاح");
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, icon: category.icon });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50" dir="rtl">
        <AppSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">إدارة الفئات</h1>
                <p className="text-muted-foreground mt-1">
                  إضافة وتعديل وحذف فئات المنتجات والمزادات
                </p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة فئة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة فئة جديدة</DialogTitle>
                    <DialogDescription>
                      أضف فئة جديدة للمنتجات والمزادات
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="add-name">اسم الفئة</Label>
                      <Input
                        id="add-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: إلكترونيات"
                        dir="rtl"
                        className="text-right"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-icon">أيقونة الفئة</Label>
                      <Input
                        id="add-icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="مثال: 📱"
                        dir="rtl"
                        className="text-right"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        يمكنك استخدام رموز تعبيرية (Emoji)
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleAdd}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-lg border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  لا توجد فئات. ابدأ بإضافة فئة جديدة.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الأيقونة</TableHead>
                      <TableHead className="text-right">اسم الفئة</TableHead>
                      <TableHead className="text-right">تاريخ الإضافة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="text-2xl">{category.icon}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(category.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الفئة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم الفئة</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                dir="rtl"
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">أيقونة الفئة</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                dir="rtl"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEdit}>
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفئة "{selectedCategory?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default DashboardCategories;