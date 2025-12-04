import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Package, Trash2, Eye, Link, Loader2, CheckCircle, XCircle, Import } from "lucide-react";

interface CJProduct {
  pid: string;
  productNameEn: string;
  productImage: string;
  sellPrice: string;
  productPrice: string;
  stock: number;
}

interface ImportedProduct {
  id: string;
  cj_product_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  product_url: string;
  category_id: string | null;
  is_active: boolean;
  imported_at: string;
}

export default function DashboardCJdropshipping() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<CJProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [productUrl, setProductUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [importCategory, setImportCategory] = useState<string>("");
  
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch imported products
  const { data: importedProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['cj-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cjdropshipping_products')
        .select('*')
        .order('imported_at', { ascending: false });
      if (error) throw error;
      return data as ImportedProduct[];
    }
  });

  // Search products
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error("أدخل كلمة البحث");
      return;
    }
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('cjdropshipping-api', {
        body: {
          action: 'search',
          params: {
            keywords: searchKeyword,
            categoryId: selectedCategory || undefined,
            page: 1,
            pageSize: 20
          }
        }
      });

      if (error) throw error;
      
      if (data.needsConfig) {
        toast.error("يرجى تكوين مفاتيح API الخاصة بـ CJdropshipping أولاً");
        return;
      }

      const products = data.data?.data?.list || data.data?.result?.list || [];
      setSearchResults(products);
      
      if (products.length === 0) {
        toast.info("لم يتم العثور على نتائج");
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || "حدث خطأ أثناء البحث");
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch by URL
  const handleFetchByUrl = async () => {
    if (!productUrl.trim()) {
      toast.error("أدخل رابط المنتج");
      return;
    }

    // Extract product ID from URL
    const pidMatch = productUrl.match(/\/product\/(\d+)|pid=(\d+)|\/p\/([a-zA-Z0-9-]+)/);
    const pid = pidMatch ? (pidMatch[1] || pidMatch[2] || pidMatch[3]) : null;

    if (!pid) {
      // Manual import with URL
      setUrlPreview({
        pid: `manual_${Date.now()}`,
        productNameEn: `منتج CJ #${Date.now()}`,
        productImage: '',
        sellPrice: '0',
        productPrice: '0',
        productUrl: productUrl,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('cjdropshipping-api', {
        body: {
          action: 'get_details',
          params: { productId: pid }
        }
      });

      if (error) throw error;
      
      const product = data.data?.data || data.data?.result;
      if (product) {
        setUrlPreview(product);
      } else {
        toast.error("لم يتم العثور على المنتج");
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      // Fallback to manual import
      setUrlPreview({
        pid: pid || `manual_${Date.now()}`,
        productNameEn: `منتج CJ #${pid || Date.now()}`,
        productImage: '',
        sellPrice: '0',
        productPrice: '0',
        productUrl: productUrl,
      });
    }
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ product, categoryId }: { product: any; categoryId: string }) => {
      const { data, error } = await supabase.functions.invoke('cjdropshipping-api', {
        body: {
          action: 'import',
          params: { product, categoryId }
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cj-products'] });
      toast.success("تم استيراد المنتج بنجاح");
      setImportDialogOpen(false);
      setSelectedProduct(null);
      setImportCategory("");
      setUrlPreview(null);
      setProductUrl("");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء الاستيراد");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cjdropshipping_products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cj-products'] });
      toast.success("تم حذف المنتج");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحذف");
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('cjdropshipping_products')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cj-products'] });
      toast.success("تم تحديث الحالة");
    }
  });

  const openImportDialog = (product: any) => {
    setSelectedProduct(product);
    setImportDialogOpen(true);
  };

  const handleImport = () => {
    if (!selectedProduct || !importCategory) {
      toast.error("اختر الفئة");
      return;
    }
    importMutation.mutate({ product: selectedProduct, categoryId: importCategory });
  };

  const activeCount = importedProducts?.filter(p => p.is_active).length || 0;
  const totalCount = importedProducts?.length || 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">إدارة منتجات CJdropshipping</h1>
                <p className="text-muted-foreground">استيراد وإدارة منتجات CJdropshipping</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Package className="w-4 h-4 ml-1" />
                  {totalCount} منتج
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-4 h-4 ml-1" />
                  {activeCount} نشط
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="search" className="space-y-4" dir="rtl">
              <TabsList className="flex-row-reverse">
                <TabsTrigger value="imported">المنتجات المستوردة</TabsTrigger>
                <TabsTrigger value="search">البحث والاستيراد</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                {/* Import by URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-right">
                      <Link className="w-5 h-5" />
                      استيراد عبر الرابط
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="الصق رابط المنتج من CJdropshipping"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        className="text-right"
                        dir="ltr"
                      />
                      <Button onClick={handleFetchByUrl}>
                        جلب
                      </Button>
                    </div>
                    
                    {urlPreview && (
                      <div className="p-4 border rounded-lg flex items-center gap-4 bg-muted/50">
                        {urlPreview.productImage && (
                          <img 
                            src={urlPreview.productImage} 
                            alt={urlPreview.productNameEn}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 text-right">
                          <h3 className="font-medium">{urlPreview.productNameEn}</h3>
                          <p className="text-sm text-muted-foreground">
                            السعر: ${urlPreview.sellPrice || '0'}
                          </p>
                        </div>
                        <Button onClick={() => openImportDialog(urlPreview)}>
                          <Import className="w-4 h-4 ml-2" />
                          استيراد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-right">
                      <Search className="w-5 h-5" />
                      البحث عن منتجات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="كلمة البحث (بالإنجليزية)"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="text-right"
                      />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="الفئة (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">جميع الفئات</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span className="mr-2">بحث</span>
                      </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {searchResults.map((product) => (
                          <Card key={product.pid} className="overflow-hidden">
                            <div className="aspect-square relative">
                              <img
                                src={product.productImage || '/placeholder.svg'}
                                alt={product.productNameEn}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <CardContent className="p-3 space-y-2">
                              <h3 className="font-medium text-sm line-clamp-2 text-right">
                                {product.productNameEn}
                              </h3>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  المخزون: {product.stock || 'غير محدد'}
                                </span>
                                <span className="font-bold text-primary">
                                  ${product.sellPrice}
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => openImportDialog(product)}
                              >
                                <Import className="w-4 h-4 ml-2" />
                                استيراد
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="imported" className="space-y-4">
                {loadingProducts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : importedProducts && importedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {importedProducts.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="aspect-square relative">
                          <img
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge 
                            className={`absolute top-2 right-2 ${product.is_active ? 'bg-green-600' : 'bg-gray-500'}`}
                          >
                            {product.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                        <CardContent className="p-3 space-y-2">
                          <h3 className="font-medium text-sm line-clamp-2 text-right">
                            {product.title_ar || product.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {new Date(product.imported_at).toLocaleDateString('en-US')}
                            </span>
                            <span className="font-bold text-primary">
                              {product.price.toLocaleString('en-US')} ر.س
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleStatusMutation.mutate({ 
                                id: product.id, 
                                is_active: !product.is_active 
                              })}
                            >
                              {product.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/cj-product/${product.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لا توجد منتجات مستوردة</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-right">استيراد المنتج</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedProduct && (
                    <div className="flex gap-4 items-center">
                      {selectedProduct.productImage && (
                        <img 
                          src={selectedProduct.productImage} 
                          alt={selectedProduct.productNameEn}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 text-right">
                        <h3 className="font-medium">{selectedProduct.productNameEn}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${selectedProduct.sellPrice || '0'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اختر الفئة</label>
                    <Select value={importCategory} onValueChange={setImportCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleImport} disabled={importMutation.isPending}>
                      {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      استيراد
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
