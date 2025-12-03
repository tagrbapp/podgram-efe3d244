import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Watch, Briefcase, Home, Car, ShoppingBag, Gem, Package,
  Building2, Smartphone, Shirt, Dumbbell, Book, Refrigerator,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CategoriesStrip = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, icon")
      .order("name");

    if (data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Watch, Briefcase, Home, Car, ShoppingBag, Gem, Package,
      Building2, Smartphone, Shirt, Dumbbell, Book, Refrigerator
    };
    return icons[iconName] || Package;
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    navigate(`/auctions?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-28 h-28 bg-card/50 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="relative group">
      {/* Gradient Fade Left */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Gradient Fade Right */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Categories Container */}
      <div className="flex gap-4 overflow-x-auto py-4 px-8 scrollbar-hide scroll-smooth">
        {/* All Categories Button */}
        <button
          onClick={() => navigate("/auctions")}
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl",
            "w-28 h-28 transition-all duration-300",
            "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
            "border-2 border-primary/30 hover:border-primary",
            "hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1",
            "group/item cursor-pointer"
          )}
        >
          <div className="p-3 rounded-xl bg-primary/20 group-hover/item:bg-primary/30 transition-colors">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground text-center leading-tight">
            الكل
          </span>
        </button>

        {categories.map((category, index) => {
          const Icon = getCategoryIcon(category.icon);
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl",
                "w-28 h-28 transition-all duration-300",
                "bg-gradient-to-br from-card via-card/80 to-muted/30",
                "border-2 hover:border-primary/50",
                "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
                "group/item cursor-pointer",
                isSelected 
                  ? "border-primary shadow-lg shadow-primary/20" 
                  : "border-border/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300",
                "bg-muted/50 group-hover/item:bg-primary/10",
                isSelected && "bg-primary/20"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-colors",
                  "text-muted-foreground group-hover/item:text-primary",
                  isSelected && "text-primary"
                )} />
              </div>
              <span className={cn(
                "text-sm font-medium text-center leading-tight transition-colors",
                "text-muted-foreground group-hover/item:text-foreground",
                isSelected && "text-foreground font-semibold"
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesStrip;
