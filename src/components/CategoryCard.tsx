import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  id?: string;
  image?: string;
  trending?: boolean;
}

const CategoryCard = ({ icon: Icon, title, count, id, image, trending = false }: CategoryCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (id) {
      navigate(`/catalog?category=${id}`);
    } else {
      navigate(`/catalog?search=${encodeURIComponent(title)}`);
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 rounded-3xl shadow-card hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 animate-fade-in"
      onClick={handleClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-accent/10 opacity-80" />
      
      {/* Icon Background - Large decorative circle */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />

      <div className="relative p-8 flex flex-col items-center text-center space-y-6">
        {/* Trending Badge */}
        {trending && (
          <Badge className="absolute top-4 left-4 bg-gradient-to-r from-secondary to-accent text-secondary-foreground border-0 shadow-elegant animate-pulse">
            <TrendingUp className="h-3 w-3 ml-1" />
            <span className="font-bold text-xs">رائج</span>
          </Badge>
        )}

        {/* Icon Container */}
        <div className="relative">
          {/* Glow circle behind icon */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
          
          {/* Main icon circle */}
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-elegant group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Icon className="h-12 w-12 text-primary-foreground drop-shadow-lg" />
          </div>

          {/* Animated ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary/30 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-bold text-2xl text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all duration-300">
            {title}
          </h3>
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant="secondary" 
              className="bg-muted/80 text-foreground border-0 px-4 py-1.5 text-sm font-bold backdrop-blur-sm"
            >
              {count.toLocaleString("en-US")} إعلان
            </Badge>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <span className="text-sm">تصفح الفئة</span>
            <ArrowLeft className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
};

export default CategoryCard;
