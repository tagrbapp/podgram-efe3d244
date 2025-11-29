import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryCatalogTagProps {
  id: string;
  name: string;
  image: string;
  count: number;
}

const CategoryCatalogTag = ({ id, name, image, count }: CategoryCatalogTagProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/catalog?category=${id}`);
  };

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/50 hover:border-primary/40 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={handleClick}
      dir="rtl"
    >
      <div className="p-5 flex items-center gap-4">
        {/* Image Container */}
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted/50">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <span className="text-sm text-muted-foreground font-medium">
              {count.toLocaleString("ar-SA")} منتج
            </span>
          </div>
        </div>

        {/* Badge */}
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-bold"
        >
          {count}
        </Badge>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};

export default CategoryCatalogTag;
