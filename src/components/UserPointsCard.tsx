import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, History, Star } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserPoints {
  total_points: number;
  level: number;
}

interface PointsHistory {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

interface UserPointsCardProps {
  userId: string;
}

export const UserPointsCard = ({ userId }: UserPointsCardProps) => {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [pointsRes, historyRes] = await Promise.all([
        supabase
          .from("user_points")
          .select("total_points, level")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("points_history")
          .select("id, points, reason, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      setUserPoints(pointsRes.data || { total_points: 0, level: 1 });
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = (points: number) => {
    const currentLevel = Math.floor(points / 100) + 1;
    const pointsInCurrentLevel = points % 100;
    const progress = pointsInCurrentLevel;
    const pointsNeeded = 100 - pointsInCurrentLevel;
    return { currentLevel, progress, pointsNeeded };
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const points = userPoints?.total_points || 0;
  const level = userPoints?.level || 1;
  const { progress, pointsNeeded } = getLevelProgress(points);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          النقاط والمستوى
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points and Level Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">إجمالي النقاط</span>
            </div>
            <p className="text-2xl font-bold text-primary">{points.toLocaleString("en-US")}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">المستوى</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{level}</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="p-4 rounded-xl bg-background/80 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">التقدم نحو المستوى {level + 1}</span>
            <Badge variant="outline" className="text-xs">
              {pointsNeeded} نقطة متبقية
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {progress}/100 نقطة
          </p>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4 text-muted-foreground" />
              آخر النشاطات
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <span className="text-muted-foreground truncate flex-1">{item.reason}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={item.points > 0 ? "default" : "destructive"}
                      className={`text-xs ${item.points > 0 ? "bg-green-500/20 text-green-700 hover:bg-green-500/30" : ""}`}
                    >
                      {item.points > 0 ? "+" : ""}{item.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
