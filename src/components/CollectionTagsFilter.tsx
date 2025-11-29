import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, Sparkles } from "lucide-react";

interface CollectionTagsFilterProps {
  selectedConditions: string[];
  selectedSeasons: string[];
  showTrending: boolean;
  onConditionChange: (condition: string) => void;
  onSeasonChange: (season: string) => void;
  onTrendingChange: (value: boolean) => void;
}

const CollectionTagsFilter = ({
  selectedConditions,
  selectedSeasons,
  showTrending,
  onConditionChange,
  onSeasonChange,
  onTrendingChange,
}: CollectionTagsFilterProps) => {
  const conditions = [
    { value: "new", label: "جديد", icon: Package },
    { value: "used", label: "مستعمل", icon: Package },
    { value: "refurbished", label: "مجدد", icon: Package },
    { value: "vintage", label: "كلاسيكي", icon: Package },
  ];

  const seasons = [
    { value: "spring_2024", label: "ربيع 2024" },
    { value: "summer_2024", label: "صيف 2024" },
    { value: "fall_2024", label: "خريف 2024" },
    { value: "winter_2024", label: "شتاء 2024" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Trending Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          المنتجات الرائجة
        </Label>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="trending"
            checked={showTrending}
            onCheckedChange={onTrendingChange}
          />
          <label
            htmlFor="trending"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            عرض المنتجات الرائجة فقط
          </label>
        </div>
      </div>

      <Separator />

      {/* Condition Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          الحالة
        </Label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition.value} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={condition.value}
                checked={selectedConditions.includes(condition.value)}
                onCheckedChange={() => onConditionChange(condition.value)}
              />
              <label
                htmlFor={condition.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                {condition.label}
                {selectedConditions.includes(condition.value) && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    ✓
                  </Badge>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Season Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          الموسم
        </Label>
        <div className="space-y-2">
          {seasons.map((season) => (
            <div key={season.value} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={season.value}
                checked={selectedSeasons.includes(season.value)}
                onCheckedChange={() => onSeasonChange(season.value)}
              />
              <label
                htmlFor={season.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                {season.label}
                {selectedSeasons.includes(season.value) && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    ✓
                  </Badge>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionTagsFilter;
