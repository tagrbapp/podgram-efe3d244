import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, ExternalLink, Eye, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportCardProps {
  report: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    created_at: string;
    listing_id: string | null;
    reporter: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    reported_user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    listing?: {
      title: string;
    } | null;
  };
  onUpdate: () => void;
}

export const ReportCard = ({ report, onUpdate }: ReportCardProps) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(report.status);
  const [notes, setNotes] = useState("");

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "معلق", variant: "secondary" as const },
      reviewed: { label: "قيد المراجعة", variant: "default" as const },
      resolved: { label: "تم الحل", variant: "default" as const },
      rejected: { label: "مرفوض", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", report.id);

      if (error) throw error;

      toast.success("تم تحديث حالة البلاغ بنجاح");
      onUpdate();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("حدث خطأ أثناء تحديث البلاغ");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: report.reported_user.id,
        });

      if (error) throw error;

      toast.success("تم حظر المستخدم بنجاح");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("حدث خطأ أثناء حظر المستخدم");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">بلاغ رقم {report.id.slice(0, 8)}</CardTitle>
          </div>
          {getStatusBadge(report.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معلومات المبلغ */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={report.reporter.avatar_url || ""} />
            <AvatarFallback>{getInitials(report.reporter.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">المُبلِّغ</p>
            <p className="text-sm text-muted-foreground">{report.reporter.full_name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/profile/${report.reporter.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* معلومات المبلغ عنه */}
        <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={report.reported_user.avatar_url || ""} />
            <AvatarFallback>{getInitials(report.reported_user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">المُبلَّغ عنه</p>
            <p className="text-sm text-muted-foreground">{report.reported_user.full_name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/profile/${report.reported_user.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBlockUser}
            >
              <Ban className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* تفاصيل البلاغ */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-1">سبب البلاغ:</p>
            <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
              {report.reason}
            </p>
          </div>
          
          {report.description && (
            <div>
              <p className="text-sm font-medium mb-1">وصف تفصيلي:</p>
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                {report.description}
              </p>
            </div>
          )}

          {report.listing && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">الإعلان المرتبط:</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/listing/${report.listing_id}`)}
                className="p-0 h-auto"
              >
                {report.listing.title}
                <ExternalLink className="h-3 w-3 mr-1" />
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            تاريخ البلاغ: {new Date(report.created_at).toLocaleDateString("ar-SA")}
          </p>
        </div>

        {/* إجراءات المشرف */}
        <div className="space-y-3 pt-3 border-t">
          <div>
            <label className="text-sm font-medium mb-2 block">تغيير الحالة:</label>
            <div className="flex gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="reviewed">قيد المراجعة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating || newStatus === report.status}
              >
                تحديث
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">ملاحظات داخلية:</label>
            <Textarea
              placeholder="أضف ملاحظاتك هنا..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
