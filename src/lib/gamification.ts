import { supabase } from "@/integrations/supabase/client";

export interface UserPoints {
  user_id: string;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  color: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface PointsHistoryItem {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export const getUserPoints = async (userId: string): Promise<UserPoints | null> => {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user points:', error);
    return null;
  }

  return data;
};

export const getAllBadges = async (): Promise<Badge[]> => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return data || [];
};

export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data || [];
};

export const getPointsHistory = async (userId: string, limit: number = 50): Promise<PointsHistoryItem[]> => {
  const { data, error } = await supabase
    .from('points_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching points history:', error);
    return [];
  }

  return data || [];
};

export const getLevelProgress = (points: number): { currentLevel: number; nextLevel: number; progress: number; pointsNeeded: number } => {
  const currentLevel = Math.floor(points / 100) + 1;
  const nextLevel = currentLevel + 1;
  const pointsInCurrentLevel = points % 100;
  const progress = (pointsInCurrentLevel / 100) * 100;
  const pointsNeeded = 100 - pointsInCurrentLevel;

  return {
    currentLevel,
    nextLevel,
    progress,
    pointsNeeded,
  };
};
