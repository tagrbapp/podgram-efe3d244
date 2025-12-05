import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Store, Loader2, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { fetchShopifyProducts, ShopifyProduct } from "@/lib/shopify";

const DashboardShopifyProducts = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    sku: "",
    vendor: "",
    productType: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchShopifyProducts(50);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("فشل في تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.title || !newProduct.price) {
      toast.error("يرجى إدخال اسم المنتج والسعر");
      return;
    }

    setIsSubmitting(true);
    try {
      // Note: This would require Shopify Admin API access
      // For now, we show a message about the limitation
      toast.info("لإضافة منتج جديد، يرجى استخدام لوحة تحكم Shopify مباشرة أو طلب إضافة المنتج من خلال المحادثة");
      setIsAddDialogOpen(false);
      setNewProduct({
        title: "",
        description: "",
        price: "",
        sku: "",
        vendor: "",
        productType: "",
      });
    } catch (error) {
      toast.error("فشل في إضافة المنتج");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    toast.info("لحذف المنتج، يرجى استخدام لوحة تحكم Shopify مباشرة أو طلب الحذف من خلال المحادثة");
  };

  const getProductImage = (product: ShopifyProduct) => {
    return product.node.images?.edges?.[0]?.node?.url || "/placeholder.svg";
  };

  const getProductPrice = (product: ShopifyProduct) => {
    const price = product.node.priceRange?.minVariantPrice;
    return price ? `${parseFloat(price.amount).toLocaleString("en-US")} ${price.currencyCode}` : "غير محدد";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" dir="rtl">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Store className="h-8 w-8 text-primary" />
                  إدارة منتجات المتجر
                </h1>
                <p className="text-muted-foreground mt-1">
                  عرض وإدارة منتجات متجر Shopify
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadProducts} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحديث"}
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة منتج
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="text-right">إضافة منتج جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-right block">اسم المنتج *</Label>
                        <Input
                          value={newProduct.title}
                          onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                          placeholder="أدخل اسم المنتج"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-right block">الوصف</Label>
                        <Textarea
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="وصف المنتج"
                          className="text-right"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-right block">السعر (ر.س) *</Label>
                          <Input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            placeholder="0.00"
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-right block">SKU</Label>
                          <Input
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            placeholder="رمز المنتج"
                            className="text-right"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-right block">العلامة التجارية</Label>
                          <Input
                            value={newProduct.vendor}
                            onChange={(e) => setNewProduct({ ...newProduct, vendor: e.target.value })}
                            placeholder="اسم العلامة"
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-right block">نوع المنتج</Label>
                          <Input
                            value={newProduct.productType}
                            onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                            placeholder="مثال: أحذية"
                            className="text-right"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddProduct} 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            جاري الإضافة...
                          </>
                        ) : (
                          "إضافة المنتج"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                      <p className="text-3xl font-bold text-foreground">
                        {products.length.toLocaleString("en-US")}
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">المتاحة للبيع</p>
                      <p className="text-3xl font-bold text-foreground">
                        {products.filter(p => 
                          p.node.variants?.edges?.some(v => v.node.availableForSale)
                        ).length.toLocaleString("en-US")}
                      </p>
                    </div>
                    <Store className="h-10 w-10 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">غير متاحة</p>
                      <p className="text-3xl font-bold text-foreground">
                        {products.filter(p => 
                          !p.node.variants?.edges?.some(v => v.node.availableForSale)
                        ).length.toLocaleString("en-US")}
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-destructive opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">قائمة المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      أضف منتجات جديدة من خلال الزر أعلاه
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table dir="rtl">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الصورة</TableHead>
                          <TableHead className="text-right">اسم المنتج</TableHead>
                          <TableHead className="text-right">السعر</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.node.id}>
                            <TableCell>
                              <img
                                src={getProductImage(product)}
                                alt={product.node.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-right">
                              {product.node.title}
                            </TableCell>
                            <TableCell className="text-right">
                              {getProductPrice(product)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.node.variants?.edges?.some(v => v.node.availableForSale) ? (
                                <Badge variant="default" className="bg-green-500">متاح</Badge>
                              ) : (
                                <Badge variant="destructive">غير متاح</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 justify-start">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => window.open(`/product/${product.node.handle}`, "_blank")}
                                  title="عرض المنتج"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => toast.info("لتعديل المنتج، يرجى طلب ذلك من خلال المحادثة")}
                                  title="تعديل"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteProduct(product.node.id)}
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardShopifyProducts;
