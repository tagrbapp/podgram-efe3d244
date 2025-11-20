import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ShieldCheck, ShieldOff, Trash2, FileX } from "lucide-react";

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  metadata: any;
  created_at: string;
}

interface ActionLogTimelineProps {
  actions: AdminAction[];
}

const ActionLogTimeline = ({ actions }: ActionLogTimelineProps) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "block_user":
        return <ShieldOff className="h-4 w-4 text-red-500" />;
      case "unblock_user":
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case "delete_listing":
        return <Trash2 className="h-4 w-4 text-orange-500" />;
      default:
        return <FileX className="h-4 w-4" />;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case "block_user":
        return "حظر مستخدم";
      case "unblock_user":
        return "إلغاء حظر مستخدم";
      case "delete_listing":
        return "حذف إعلان";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل الإجراءات</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {actions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد إجراءات</p>
            ) : (
              actions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0"
                >
                  <div className="mt-1">{getActionIcon(action.action_type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{getActionText(action.action_type)}</p>
                      <Badge variant="outline" className="text-xs">
                        {action.target_type}
                      </Badge>
                    </div>
                    {action.reason && (
                      <p className="text-sm text-muted-foreground">السبب: {action.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(action.created_at), "PPp")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActionLogTimeline;
