import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Award, Trophy, Star, Target, Zap, Crown, Medal, Shield } from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string | null;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  reward_points: number;
  earned_at?: string;
  times_earned?: number;
}

interface UserBadgesSectionProps {
  userId: string;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Award, Trophy, Star, Target, Zap, Crown, Medal, Shield
};

export const UserBadgesSection = ({ userId }: UserBadgesSectionProps) => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [badgesRes, userBadgesRes, achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
        supabase.from("achievements").select("*").eq("is_active", true),
        supabase.from("user_achievements").select("achievement_id, earned_at, times_earned").eq("user_id", userId)
      ]);

      setBadges(badgesRes.data || []);
      setUserBadges(userBadgesRes.data || []);
      
      // Merge achievements with user data
      const achievementMap = new Map(
        (userAchievementsRes.data || []).map(ua => [ua.achievement_id, ua])
      );
      
      const enrichedAchievements = (achievementsRes.data || []).map(a => ({
        ...a,
        earned_at: achievementMap.get(a.id)?.earned_at,
        times_earned: achievementMap.get(a.id)?.times_earned || 0
      }));
      
      setAchievements(enrichedAchievements);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));
  const unearnedBadges = badges.filter(b => !earnedBadgeIds.has(b.id));
  const earnedAchievements = achievements.filter(a => a.earned_at);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Award;
    return IconComponent;
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Earned Badges */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-primary" />
            الشارات المكتسبة
            <Badge variant="secondary" className="mr-2">
              {earnedBadges.length}/{badges.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {earnedBadges.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              لم تحصل على أي شارات بعد
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {earnedBadges.map((badge) => {
                const IconComponent = getIcon(badge.icon);
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-center">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              الإنجازات
              <Badge variant="secondary" className="mr-2">
                {earnedAchievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {earnedAchievements.slice(0, 5).map((achievement) => {
                const IconComponent = getIcon(achievement.icon);
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      {achievement.description && (
                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                      )}
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">
                      +{achievement.reward_points} نقطة
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress to next badges */}
      {unearnedBadges.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-muted-foreground" />
              شارات قادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {unearnedBadges.slice(0, 3).map((badge) => {
                const IconComponent = getIcon(badge.icon);
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 opacity-70"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-muted-foreground">{badge.name}</h4>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground/70 truncate">{badge.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
