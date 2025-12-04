import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Package, Download, Trash2, ExternalLink, Loader2, ShoppingBag, Store, Star } from "lucide-react";

interface AliExpressProduct {
  product_id: string;
  product_title: string;
  product_main_image_url: string;
  product_small_image_urls?: { string: string[] };
  target_sale_price: string;
  target_original_price: string;
  discount?: string;
  product_detail_url: string;
  shop_title?: string;
  evaluate_rate?: string;
}

interface ImportedProduct {
  id: string;
  aliexpress_product_id: string;
  title: string;
  title_ar: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[];
  product_url: string;
  category_id: string | null;
  seller_name: string | null;
  is_active: boolean;
  imported_at: string;
}

export default function DashboardAliexpress() {
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchResults, setSearchResults] = useState<AliExpressProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);
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
    queryKey: ['aliexpress-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aliexpress_products')
        .select('*')
        .order('imported_at', { ascending: false });
      if (error) throw error;
      return data as ImportedProduct[];
    }
  });

  // Search AliExpress products
  const handleSearch = async () => {
    if (!searchKeywords.trim()) {
      toast.error('أدخل كلمات البحث');
      return;
    }

    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('يجب تسجيل الدخول');
        return;
      }

      const response = await supabase.functions.invoke('aliexpress-api', {
        body: {
          action: 'search',
          keywords: searchKeywords,
          categoryId: selectedCategory === "all" ? undefined : selectedCategory || undefined,
          page: 1,
          pageSize: 20
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product) {
        setSearchResults(data.aliexpress_affiliate_product_query_response.resp_result.result.products.product);
        toast.success(`تم العثور على ${data.aliexpress_affiliate_product_query_response.resp_result.result.products.product.length} منتج`);
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        setSearchResults([]);
        toast.info('لم يتم العثور على منتجات');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'فشل في البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // Import product mutation
  const importMutation = useMutation({
    mutationFn: async ({ product, categoryId }: { product: AliExpressProduct; categoryId: string }) => {
      const response = await supabase.functions.invoke('aliexpress-api', {
        body: {
          action: 'import',
          product,
          categoryId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success('تم استيراد المنتج بنجاح');
      queryClient.invalidateQueries({ queryKey: ['aliexpress-products'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في استيراد المنتج');
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('aliexpress_products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف المنتج');
      queryClient.invalidateQueries({ queryKey: ['aliexpress-products'] });
    },
    onError: () => {
      toast.error('فشل في حذف المنتج');
    }
  });

  // Toggle product status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('aliexpress_products')
        .update({ is_active: isActive })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة المنتج');
      queryClient.invalidateQueries({ queryKey: ['aliexpress-products'] });
    }
  });

  const activeProducts = importedProducts?.filter(p => p.is_active).length || 0;
  const inactiveProducts = importedProducts?.filter(p => !p.is_active).length || 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">منتجات AliExpress</h1>
                  <p className="text-sm text-muted-foreground">إدارة واستيراد المنتجات</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Package className="h-3.5 w-3.5 ml-1.5" />
                  {importedProducts?.length || 0} منتج
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 border-green-500/50 text-green-600">
                  {activeProducts} نشط
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 border-muted text-muted-foreground">
                  {inactiveProducts} متوقف
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="search" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="search" className="text-sm md:text-base gap-2">
                  <Search className="h-4 w-4" />
                  البحث والاستيراد
                </TabsTrigger>
                <TabsTrigger value="imported" className="text-sm md:text-base gap-2">
                  <Package className="h-4 w-4" />
                  المنتجات المستوردة
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Search className="h-5 w-5 text-primary" />
                      البحث في AliExpress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <Label className="text-right block mb-2">كلمات البحث</Label>
                        <Input
                          placeholder="ابحث عن منتجات..."
                          value={searchKeywords}
                          onChange={(e) => setSearchKeywords(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="text-right"
                          dir="rtl"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-right block mb-2">الفئة (اختياري)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="text-right" dir="rtl">
                            <SelectValue placeholder="اختر فئة" />
                          </SelectTrigger>
                          <SelectContent align="start" dir="rtl">
                            <SelectItem value="all">جميع الفئات</SelectItem>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 flex items-end">
                        <Button 
                          onClick={handleSearch} 
                          disabled={isSearching} 
                          className="w-full h-10"
                        >
                          {isSearching ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              جاري...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 ml-2" />
                              بحث
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">
                        نتائج البحث ({searchResults.length} منتج)
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {searchResults.map((product) => (
                        <Card key={product.product_id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
                          <div className="aspect-square relative overflow-hidden">
                            <img
                              src={product.product_main_image_url}
                              alt={product.product_title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.discount && (
                              <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                                -{product.discount}%
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4 space-y-3 text-right">
                            <h3 className="font-medium text-sm line-clamp-2 leading-relaxed" title={product.product_title}>
                              {product.product_title}
                            </h3>
                            <div className="flex items-center justify-end gap-2 flex-row-reverse">
                              <span className="text-lg font-bold text-primary">
                                {parseFloat(product.target_sale_price).toLocaleString('en-US')} ر.س
                              </span>
                              {product.target_original_price !== product.target_sale_price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {parseFloat(product.target_original_price).toLocaleString('en-US')}
                                </span>
                              )}
                            </div>
                            {product.shop_title && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                                <span>{product.shop_title}</span>
                                <Store className="h-3.5 w-3.5" />
                              </div>
                            )}
                            {product.evaluate_rate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                                <span>{product.evaluate_rate}%</span>
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              </div>
                            )}
                            <div className="flex gap-2 flex-row-reverse pt-2">
                              <ImportDialog 
                                product={product} 
                                categories={categories || []}
                                onImport={(categoryId) => importMutation.mutate({ product, categoryId })}
                                isLoading={importMutation.isPending}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(product.product_detail_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && !isSearching && (
                  <Card className="p-12 text-center border-dashed">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">ابدأ البحث</h3>
                    <p className="text-muted-foreground text-sm">أدخل كلمات البحث للعثور على منتجات من AliExpress</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="imported" className="space-y-6">
                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
                  </div>
                ) : importedProducts && importedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {importedProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className={`overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 ${!product.is_active ? 'opacity-70' : ''}`}
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge 
                            className={`absolute top-2 right-2 ${product.is_active ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}
                          >
                            {product.is_active ? 'نشط' : 'متوقف'}
                          </Badge>
                          {product.discount_percentage && product.discount_percentage > 0 && (
                            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                              -{product.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3 text-right">
                          <h3 className="font-medium text-sm line-clamp-2 leading-relaxed" title={product.title}>
                            {product.title}
                          </h3>
                          <div className="flex items-center justify-end gap-2 flex-row-reverse">
                            <span className="text-lg font-bold text-primary">
                              {product.price.toLocaleString('en-US')} ر.س
                            </span>
                            {product.original_price && product.original_price !== product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {product.original_price.toLocaleString('en-US')}
                              </span>
                            )}
                          </div>
                          {product.seller_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                              <span>{product.seller_name}</span>
                              <Store className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            تم الاستيراد: {new Date(product.imported_at).toLocaleDateString('en-US')}
                          </p>
                          <div className="flex gap-2 flex-row-reverse pt-2">
                            <Button
                              variant={product.is_active ? "outline" : "default"}
                              size="sm"
                              className="flex-1"
                              onClick={() => toggleStatusMutation.mutate({ 
                                productId: product.id, 
                                isActive: !product.is_active 
                              })}
                            >
                              {product.is_active ? 'إيقاف' : 'تفعيل'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">لا توجد منتجات مستوردة</h3>
                    <p className="text-muted-foreground text-sm mb-4">ابدأ بالبحث واستيراد المنتجات من AliExpress</p>
                    <Button variant="outline" onClick={() => document.querySelector('[value="search"]')?.dispatchEvent(new Event('click'))}>
                      <Search className="h-4 w-4 ml-2" />
                      ابدأ البحث
                    </Button>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// Import Dialog Component
function ImportDialog({ 
  product, 
  categories, 
  onImport, 
  isLoading 
}: { 
  product: AliExpressProduct; 
  categories: { id: string; name: string }[];
  onImport: (categoryId: string) => void;
  isLoading: boolean;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [open, setOpen] = useState(false);

  const handleImport = () => {
    if (!categoryId) {
      toast.error('اختر فئة للمنتج');
      return;
    }
    onImport(categoryId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1">
          <Download className="h-4 w-4 ml-1.5" />
          استيراد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">استيراد المنتج</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-2 text-right">
              <h4 className="font-medium text-sm line-clamp-2">{product.product_title}</h4>
              <p className="text-primary font-bold">
                {parseFloat(product.target_sale_price).toLocaleString('en-US')} ر.س
              </p>
            </div>
            <img
              src={product.product_main_image_url}
              alt={product.product_title}
              className="w-20 h-20 object-cover rounded-lg border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-right block">اختر الفئة *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="text-right" dir="rtl">
                <SelectValue placeholder="اختر فئة للمنتج" />
              </SelectTrigger>
              <SelectContent align="start" dir="rtl">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 flex-row-reverse">
          <Button onClick={handleImport} disabled={isLoading || !categoryId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                استيراد
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
