import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CategoryCatalogTag from "./CategoryCatalogTag";
import { Skeleton } from "@/components/ui/skeleton";

// Import category images
import categoryBagsImage from "@/assets/category-bags.jpg";
import categoryJewelryImage from "@/assets/category-jewelry.jpg";
import categoryMensImage from "@/assets/category-mens.jpg";
import categoryWatchesImage from "@/assets/category-watches.jpg";

interface Category {
  id: string;
  name: string;
  icon: string;
  listings_count: number;
}

const CategoryCatalogSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Map category names to images
  const categoryImages: Record<string, string> = {
    "حقائب": categoryBagsImage,
    "مجوهرات": categoryJewelryImage,
    "أزياء رجالية": categoryMensImage,
    "ساعات": categoryWatchesImage,
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name, icon");

    if (categoriesData) {
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category) => {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("status", "active");

          return {
            ...category,
            listings_count: count || 0,
          };
        })
      );

      // Filter categories with items and sort by count
      const filteredCategories = categoriesWithCount
        .filter((cat) => cat.listings_count > 0)
        .sort((a, b) => b.listings_count - a.listings_count)
        .slice(0, 6);

      setCategories(filteredCategories);
    }
    
    setLoading(false);
  };

  // Get image for category
  const getCategoryImage = (categoryName: string) => {
    return categoryImages[categoryName] || categoryBagsImage;
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold text-foreground">
            تصفح حسب التصنيف
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعتنا الواسعة من المنتجات المصنفة بعناية
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCatalogTag
              key={category.id}
              id={category.id}
              name={category.name}
              image={getCategoryImage(category.name)}
              count={category.listings_count}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCatalogSection;
