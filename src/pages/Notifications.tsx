import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Check, Trash2, RotateCcw, Bell, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useRealtimeNotifications(user?.id);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.is_read;
    if (filter === "read") return notification.is_read;
    return notification.type === filter;
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'bid':
      case 'outbid':
      case 'auction_start':
      case 'auction_end':
      case 'auction_won':
        if (notification.listing_id) {
          navigate(`/auction/${notification.listing_id}`);
        }
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'favorite':
      case 'sale':
        if (notification.listing_id) {
          navigate(`/listing/${notification.listing_id}`);
        }
        break;
      case 'review':
        if (notification.related_user_id) {
          navigate(`/profile/${notification.related_user_id}`);
        } else {
          navigate('/dashboard');
        }
        break;
      case 'system':
        if (notification.related_user_id) {
          navigate('/dashboard/user-approvals');
        } else {
          navigate('/dashboard');
        }
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid':
      case 'outbid':
        return '💰';
      case 'sale':
        return '🎉';
      case 'message':
        return '💬';
      case 'favorite':
        return '❤️';
      case 'review':
        return '⭐';
      case 'auction_start':
        return '🚀';
      case 'auction_end':
        return '⏰';
      case 'auction_won':
        return '🏆';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-20">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <CardTitle className="text-2xl">الإشعارات</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} غير مقروء</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} size="sm">
                    <Check className="h-4 w-4 ml-2" />
                    تحديد الكل كمقروء
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    onClick={deleteAllNotifications}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف الكل
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="تصفية الإشعارات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الإشعارات</SelectItem>
                  <SelectItem value="unread">غير المقروءة</SelectItem>
                  <SelectItem value="read">المقروءة</SelectItem>
                  <SelectItem value="bid">المزايدات</SelectItem>
                  <SelectItem value="message">الرسائل</SelectItem>
                  <SelectItem value="sale">المبيعات</SelectItem>
                  <SelectItem value="system">النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-right">{notification.title}</h4>
                            {!notification.is_read && (
                              <Badge variant="default" className="flex-shrink-0">جديد</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground text-right mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground text-right">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            {notification.is_read ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsUnread(notification.id);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 ml-2" />
                                تحديد كغير مقروء
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-4 w-4 ml-2" />
                                تحديد كمقروء
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;