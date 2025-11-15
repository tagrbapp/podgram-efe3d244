import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
}

const CategoryCard = ({ icon: Icon, title, count }: CategoryCardProps) => {
  return (
    <Card className="p-6 hover:shadow-glow transition-smooth cursor-pointer group border-border/30 bg-card/50 backdrop-blur-sm hover:scale-105 hover:border-primary/50">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-smooth shadow-glow-secondary">
          <Icon className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-luxury font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-arabic">{count} إعلان</p>
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;
