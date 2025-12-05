import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Store, 
  Loader2, 
  Package, 
  ExternalLink, 
  Search,
  Grid3X3,
  List,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Eye,
  MoreVertical,
  Filter,
  SortAsc
} from "lucide-react";
import { toast } from "sonner";
import { fetchShopifyProducts, ShopifyProduct } from "@/lib/shopify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardShopifyProducts = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");
  const [sortBy, setSortBy] = useState<"title" | "price" | "date">("title");
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

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, statusFilter, sortBy]);

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

  const filterAndSortProducts = () => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.node.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === "available") {
      result = result.filter(p => 
        p.node.variants?.edges?.some(v => v.node.availableForSale)
      );
    } else if (statusFilter === "unavailable") {
      result = result.filter(p => 
        !p.node.variants?.edges?.some(v => v.node.availableForSale)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") {
        return a.node.title.localeCompare(b.node.title);
      } else if (sortBy === "price") {
        const priceA = parseFloat(a.node.priceRange?.minVariantPrice?.amount || "0");
        const priceB = parseFloat(b.node.priceRange?.minVariantPrice?.amount || "0");
        return priceB - priceA;
      }
      return 0;
    });

    setFilteredProducts(result);
  };

  const handleAddProduct = async () => {
    if (!newProduct.title || !newProduct.price) {
      toast.error("يرجى إدخال اسم المنتج والسعر");
      return;
    }

    setIsSubmitting(true);
    try {
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
    return price ? parseFloat(price.amount) : 0;
  };

  const formatPrice = (price: number, currency: string = "SAR") => {
    return `${price.toLocaleString("en-US")} ر.س`;
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + getProductPrice(p), 0);
  };

  const getAvailableCount = () => {
    return products.filter(p => 
      p.node.variants?.edges?.some(v => v.node.availableForSale)
    ).length;
  };

  const isProductAvailable = (product: ShopifyProduct) => {
    return product.node.variants?.edges?.some(v => v.node.availableForSale);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" dir="rtl">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Hero Header */}
          <div className="relative bg-gradient-to-bl from-primary/20 via-primary/10 to-background border-b border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                        <Store className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          إدارة منتجات المتجر
                        </h1>
                        <p className="text-muted-foreground">
                          عرض وإدارة منتجات متجر Shopify الخاص بك
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={loadProducts} 
                      disabled={loading}
                      className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      تحديث
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/25">
                          <Plus className="h-4 w-4" />
                          إضافة منتج جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            إضافة منتج جديد
                          </DialogTitle>
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
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                        <p className="text-3xl font-bold text-foreground mt-1">
                          {products.length.toLocaleString("en-US")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">منتج في المتجر</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المتاحة للبيع</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          {getAvailableCount().toLocaleString("en-US")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {products.length > 0 ? `${Math.round((getAvailableCount() / products.length) * 100)}% من المنتجات` : '0%'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <ShoppingBag className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">غير متاحة</p>
                        <p className="text-3xl font-bold text-orange-600 mt-1">
                          {(products.length - getAvailableCount()).toLocaleString("en-US")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">تحتاج مراجعة</p>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي القيمة</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {formatPrice(getTotalValue())}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">قيمة المخزون</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full lg:max-w-md">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في المنتجات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 text-right"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 ml-2" />
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="available">متاح</SelectItem>
                          <SelectItem value="unavailable">غير متاح</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                        <SelectTrigger className="w-[140px]">
                          <SortAsc className="h-4 w-4 ml-2" />
                          <SelectValue placeholder="ترتيب" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="title">الاسم</SelectItem>
                          <SelectItem value="price">السعر</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 p-1 bg-muted rounded-lg">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Display */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-16">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">لا توجد منتجات</h3>
                        <p className="text-muted-foreground mt-1">
                          {searchQuery || statusFilter !== "all" 
                            ? "لا توجد نتائج مطابقة للبحث" 
                            : "أضف منتجات جديدة من خلال الزر أعلاه"}
                        </p>
                      </div>
                      {(searchQuery || statusFilter !== "all") && (
                        <Button 
                          variant="outline" 
                          onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                        >
                          إعادة تعيين الفلاتر
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.node.id} 
                      className="group overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={getProductImage(product)}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3">
                          {isProductAvailable(product) ? (
                            <Badge className="bg-green-500/90 hover:bg-green-500 shadow-lg">
                              متاح
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="shadow-lg">
                              غير متاح
                            </Badge>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <Button
                            size="sm"
                            className="flex-1 shadow-lg"
                            onClick={() => window.open(`/product/${product.node.handle}`, "_blank")}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="secondary" className="shadow-lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => toast.info("لتعديل المنتج، يرجى طلب ذلك من خلال المحادثة")}>
                                <Pencil className="h-4 w-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteProduct(product.node.id)}
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.node.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">
                          {product.node.description || "لا يوجد وصف"}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(getProductPrice(product))}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {product.node.variants?.edges?.length || 0} متغير
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table dir="rtl">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-right w-20">الصورة</TableHead>
                            <TableHead className="text-right">اسم المنتج</TableHead>
                            <TableHead className="text-right">الوصف</TableHead>
                            <TableHead className="text-right">السعر</TableHead>
                            <TableHead className="text-right">المتغيرات</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right w-32">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.node.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={getProductImage(product)}
                                    alt={product.node.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-right">
                                <span className="hover:text-primary cursor-pointer transition-colors">
                                  {product.node.title}
                                </span>
                              </TableCell>
                              <TableCell className="text-right max-w-xs">
                                <span className="text-muted-foreground text-sm line-clamp-2">
                                  {product.node.description || "لا يوجد وصف"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-primary">
                                {formatPrice(getProductPrice(product))}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">
                                  {product.node.variants?.edges?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isProductAvailable(product) ? (
                                  <Badge className="bg-green-500/90">متاح</Badge>
                                ) : (
                                  <Badge variant="destructive">غير متاح</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 justify-start">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(`/product/${product.node.handle}`, "_blank")}
                                    title="عرض المنتج"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => toast.info("لتعديل المنتج، يرجى طلب ذلك من خلال المحادثة")}
                                    title="تعديل"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
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
                  </CardContent>
                </Card>
              )}

              {/* Results count */}
              {!loading && filteredProducts.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  عرض {filteredProducts.length.toLocaleString("en-US")} من {products.length.toLocaleString("en-US")} منتج
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardShopifyProducts;
