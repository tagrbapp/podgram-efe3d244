import { Badge } from "@/lib/gamification";
import { Card } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeDisplayProps {
  badge: Badge;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

const BadgeDisplay = ({ badge, earned = false, size = "md", showDescription = true }: BadgeDisplayProps) => {
  const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.Award;
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50",
    green: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
    gold: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50",
    purple: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/50",
    red: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50",
    pink: "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/50",
    yellow: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50",
  };

  const badgeContent = (
    <Card
      className={cn(
        "relative p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105",
        !earned && "opacity-50 grayscale",
        earned && "animate-pulse-slow shadow-lg"
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 transition-all",
          sizeClasses[size],
          colorClasses[badge.color] || colorClasses.blue
        )}
      >
        <IconComponent size={iconSizes[size]} />
      </div>
      {showDescription && (
        <div className="text-center">
          <h4 className="font-semibold text-sm">{badge.name}</h4>
          {badge.description && (
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          )}
        </div>
      )}
      {!earned && (
        <div className="absolute top-2 right-2">
          <LucideIcons.Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );

  if (!showDescription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-semibold">{badge.name}</p>
              {badge.description && (
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              )}
              {!earned && (
                <p className="text-xs text-muted-foreground mt-1">
                  المتطلبات: {badge.requirement_value}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
};

export default BadgeDisplay;
