import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Watch, Briefcase, Home, Car, ShoppingBag, Gem, Package,
  Building2, Smartphone, Shirt, Dumbbell, Book, Refrigerator,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoriesStripProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategory?: string | null;
}

const CategoriesStrip = ({ onCategorySelect, selectedCategory: externalSelected }: CategoriesStripProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const selectedCategory = externalSelected !== undefined ? externalSelected : internalSelected;

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // RTL: scrollLeft is negative
      setCanScrollRight(scrollLeft > -(scrollWidth - clientWidth - 10));
      setCanScrollLeft(scrollLeft < -10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

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

  const handleCategoryClick = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      setInternalSelected(categoryId);
      if (categoryId) {
        navigate(`/auctions?category=${categoryId}`);
      } else {
        navigate(`/auctions`);
      }
    }
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
    <div className="relative group" dir="rtl">
      {/* Navigation Arrows */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={scrollRight}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
      
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Gradient Fade Left */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Gradient Fade Right */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Categories Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto py-4 px-14 scrollbar-hide scroll-smooth"
      >
        {/* All Categories Button */}
        <button
          onClick={() => handleCategoryClick(null)}
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl",
            "w-28 h-28 transition-all duration-300",
            "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
            "border-2 hover:border-primary",
            "hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1",
            "group/item cursor-pointer",
            selectedCategory === null 
              ? "border-primary shadow-lg shadow-primary/20" 
              : "border-primary/30"
          )}
        >
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            selectedCategory === null ? "bg-primary/30" : "bg-primary/20 group-hover/item:bg-primary/30"
          )}>
            <Package className="w-6 h-6 text-primary" />
          </div>
          <span className={cn(
            "text-sm text-center leading-tight transition-colors",
            selectedCategory === null ? "font-bold text-foreground" : "font-semibold text-foreground"
          )}>
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
