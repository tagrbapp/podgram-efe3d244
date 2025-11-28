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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
    // فلترة حسب النوع/الحالة
    let typeMatch = true;
    if (filter === "unread") typeMatch = !notification.is_read;
    else if (filter === "read") typeMatch = notification.is_read;
    else if (filter !== "all") typeMatch = notification.type === filter;

    // البحث النصي
    const searchMatch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    // فلترة حسب التاريخ
    let dateMatch = true;
    const notificationDate = new Date(notification.created_at);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateMatch = dateMatch && notificationDate >= start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch = dateMatch && notificationDate <= end;
    }

    return typeMatch && searchMatch && dateMatch;
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
            <div className="space-y-4 mb-6">
              {/* البحث النصي */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ابحث في العنوان أو الرسالة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-right"
                  />
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {(searchQuery || startDate || endDate || filter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStartDate("");
                      setEndDate("");
                      setFilter("all");
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </div>

              {/* الفلاتر */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">النوع:</label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="تصفية الإشعارات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="unread">غير المقروءة</SelectItem>
                      <SelectItem value="read">المقروءة</SelectItem>
                      <SelectItem value="bid">المزايدات</SelectItem>
                      <SelectItem value="outbid">تجاوز المزايدة</SelectItem>
                      <SelectItem value="message">الرسائل</SelectItem>
                      <SelectItem value="sale">المبيعات</SelectItem>
                      <SelectItem value="auction_start">بدء المزاد</SelectItem>
                      <SelectItem value="auction_end">انتهاء المزاد</SelectItem>
                      <SelectItem value="auction_won">فوز بالمزاد</SelectItem>
                      <SelectItem value="system">النظام</SelectItem>
                      <SelectItem value="favorite">المفضلة</SelectItem>
                      <SelectItem value="review">التقييمات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">من:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">إلى:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* عدد النتائج */}
              <div className="text-sm text-muted-foreground">
                عرض {filteredNotifications.length} من {notifications.length} إشعار
              </div>
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