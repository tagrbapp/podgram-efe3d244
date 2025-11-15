import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 
  | "message" 
  | "bid" 
  | "sale" 
  | "review" 
  | "favorite" 
  | "auction_start"
  | "auction_end"
  | "auction_won"
  | "outbid"
  | "system";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  listingId?: string | null;
  relatedUserId?: string | null;
}

/**
 * Create a new notification for a user
 * This will automatically trigger the realtime notification system
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type,
  listingId = null,
  relatedUserId = null,
}: CreateNotificationParams) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      listing_id: listingId,
      related_user_id: relatedUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }

  return data;
};

/**
 * Bulk create notifications for multiple users
 */
export const createBulkNotifications = async (
  notifications: CreateNotificationParams[]
) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert(
      notifications.map((n) => ({
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        listing_id: n.listingId || null,
        related_user_id: n.relatedUserId || null,
      }))
    )
    .select();

  if (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }

  return data;
};

/**
 * Delete old read notifications (older than 30 days)
 */
export const cleanupOldNotifications = async (userId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("is_read", true)
    .lt("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("Error cleaning up notifications:", error);
    throw error;
  }
};
