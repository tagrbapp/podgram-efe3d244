import { Card } from "@/components/ui/card";

interface CategoryCircleProps {
  image: string;
  title: string;
  badge?: string;
  badgeColor?: string;
}

const CategoryCircle = ({ image, title, badge, badgeColor = "bg-red-500" }: CategoryCircleProps) => {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer flex-shrink-0">
      <div className="relative">
        <Card className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-md hover:shadow-lg transition-smooth group-hover:scale-105 p-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </Card>
        {badge && (
          <div className={`absolute -top-1 -left-1 ${badgeColor} text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md`}>
            {badge}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600 text-center font-medium group-hover:text-qultura-blue transition-smooth">
        {title}
      </span>
    </div>
  );
};

export default CategoryCircle;
