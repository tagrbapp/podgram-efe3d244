import { Bell, Check, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NotificationsDropdownProps {
  userId: string | null;
}

export const NotificationsDropdown = ({ userId }: NotificationsDropdownProps) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useRealtimeNotifications(userId);

  const handleNotificationClick = async (notification: {
    id: string;
    type: string;
    listing_id: string | null;
    related_user_id: string | null;
    is_read: boolean;
    title: string;
    message: string;
  }) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Route based on notification type
    switch (notification.type) {
      case 'bid':
      case 'outbid':
      case 'auction_start':
      case 'auction_end':
      case 'auction_won':
        // Navigate to auction details if listing_id exists
        if (notification.listing_id) {
          navigate(`/auction/${notification.listing_id}`);
        }
        break;
      
      case 'message':
        // Navigate to messages page
        navigate('/messages');
        break;
      
      case 'review':
        // Navigate to listing or profile if available
        if (notification.listing_id) {
          navigate(`/listing/${notification.listing_id}`);
        } else if (notification.related_user_id) {
          navigate(`/profile/${notification.related_user_id}`);
        }
        break;
      
      case 'sale':
      case 'favorite':
        // Navigate to listing details
        if (notification.listing_id) {
          navigate(`/listing/${notification.listing_id}`);
        }
        break;
      
      case 'system':
        // Check if it's an approval/rejection notification
        if (notification.title.includes('موافق') || notification.title.includes('رفض') || notification.title.includes('قبول')) {
          // Navigate to dashboard for approval status
          navigate('/dashboard');
        } else if (notification.message.includes('موافقة') || notification.message.includes('مراجعة')) {
          // Admin approval notifications - go to approvals page
          navigate('/dashboard/user-approvals');
        }
        break;
      
      default:
        // For any other type with listing_id
        if (notification.listing_id) {
          navigate(`/listing/${notification.listing_id}`);
        }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "bid":
      case "outbid":
        return "🔨";
      case "auction_start":
        return "🏁";
      case "auction_end":
        return "⏰";
      case "auction_won":
        return "🏆";
      case "sale":
        return "💰";
      case "review":
        return "⭐";
      case "favorite":
        return "❤️";
      case "system":
        return "🔔";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent transition-all duration-200 hover:scale-105"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:text-primary"
            >
              <Check className="h-3 w-3 ml-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 py-8">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick({
                      id: notification.id,
                      type: notification.type,
                      listing_id: notification.listing_id,
                      related_user_id: notification.related_user_id,
                      is_read: notification.is_read,
                      title: notification.title,
                      message: notification.message,
                    })
                  }
                >
                  <div className="flex gap-3 w-full">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={deleteAllNotifications}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف جميع الإشعارات
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
