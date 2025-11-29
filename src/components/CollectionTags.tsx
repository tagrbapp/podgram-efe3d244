import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Package, Star } from "lucide-react";

interface CollectionTagsProps {
  season?: string;
  condition: string;
  conditionRating?: number;
  isTrending?: boolean;
  tags?: string[];
  compact?: boolean;
}

const CollectionTags = ({
  season,
  condition,
  conditionRating,
  isTrending,
  tags,
  compact = false
}: CollectionTagsProps) => {
  const getConditionLabel = (cond: string) => {
    const labels: Record<string, string> = {
      new: "جديد",
      used: "مستعمل",
      refurbished: "مجدد",
      vintage: "كلاسيكي"
    };
    return labels[cond] || cond;
  };

  const getConditionColor = (cond: string) => {
    const colors: Record<string, string> = {
      new: "bg-secondary/10 text-secondary border-secondary/30",
      used: "bg-primary/10 text-primary border-primary/30",
      refurbished: "bg-accent/10 text-accent-foreground border-accent/30",
      vintage: "bg-muted text-foreground border-border"
    };
    return colors[cond] || colors.new;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
        {isTrending && (
          <Badge className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground border-0 px-2 py-0.5 text-[10px] font-bold">
            <Sparkles className="h-2.5 w-2.5 ml-1" />
            رائج
          </Badge>
        )}
        {season && (
          <Badge variant="outline" className="bg-muted/50 border-border/50 px-2 py-0.5 text-[10px]">
            <Calendar className="h-2.5 w-2.5 ml-1" />
            {season}
          </Badge>
        )}
        {condition && (
          <Badge variant="outline" className={`${getConditionColor(condition)} px-2 py-0.5 text-[10px]`}>
            <Package className="h-2.5 w-2.5 ml-1" />
            {getConditionLabel(condition)}
            {conditionRating && condition === 'used' && (
              <span className="mr-1 font-bold">{conditionRating}/10</span>
            )}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      {/* Trending Badge */}
      {isTrending && (
        <Badge className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground border-0 px-3 py-1 text-xs font-bold shadow-sm animate-pulse">
          <Sparkles className="h-3.5 w-3.5 ml-1" />
          رائج
        </Badge>
      )}

      {/* Season Badge */}
      {season && (
        <Badge variant="outline" className="bg-muted/50 border-border/50 px-3 py-1 text-xs">
          <Calendar className="h-3.5 w-3.5 ml-1" />
          {season}
        </Badge>
      )}

      {/* Condition Badge */}
      {condition && (
        <Badge 
          variant="outline" 
          className={`${getConditionColor(condition)} px-3 py-1 text-xs font-semibold`}
        >
          <Package className="h-3.5 w-3.5 ml-1" />
          {getConditionLabel(condition)}
          {conditionRating && condition === 'used' && (
            <span className="mr-1.5 flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current" />
              {conditionRating}/10
            </span>
          )}
        </Badge>
      )}

      {/* Custom Tags */}
      {tags && tags.length > 0 && tags.map((tag, index) => (
        <Badge 
          key={index}
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs"
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default CollectionTags;
