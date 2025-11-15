import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
}

const CategoryCard = ({ icon: Icon, title, count }: CategoryCardProps) => {
  return (
    <Card className="p-6 hover:shadow-elegant transition-smooth cursor-pointer group border-border/50">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-smooth shadow-glow">
          <Icon className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{count} إعلان</p>
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;
