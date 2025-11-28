import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle } from "lucide-react";

interface MembershipUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MembershipUpgradeDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: MembershipUpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      // Get current profile data
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("membership_type, approval_status")
        .eq("id", user.id)
        .single();

      // Update membership type to merchant with pending status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          membership_type: "merchant",
          approval_status: "pending",
          approved_at: null,
          approved_by: null,
          rejection_reason: null
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Record history
      if (currentProfile) {
        await supabase
          .from("membership_change_history")
          .insert({
            user_id: user.id,
            from_type: currentProfile.membership_type,
            to_type: "merchant",
            from_status: currentProfile.approval_status,
            to_status: "pending"
          });
      }

      toast.success("تم إرسال طلب الترقية بنجاح!", {
        description: "سيتم مراجعة طلبك خلال 1-3 أيام عمل",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error upgrading membership:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="text-right max-w-md" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="h-5 w-5 text-primary" />
            تأكيد ترقية العضوية
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-4 pt-4">
            <p className="text-foreground">
              هل أنت متأكد من رغبتك في ترقية عضويتك إلى <strong>تاجر</strong>؟
            </p>
            
            <div className="bg-primary/5 p-4 rounded-lg space-y-3 border border-primary/20">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="font-semibold text-foreground">
                  مدة المراجعة
                </p>
              </div>
              <p className="text-sm text-muted-foreground pr-7">
                سيتم مراجعة طلبك من قبل الإدارة خلال <strong className="text-foreground">1-3 أيام عمل</strong>
              </p>
              <p className="text-sm text-muted-foreground pr-7">
                سيتم إشعارك عبر الإشعارات بمجرد الموافقة على طلبك
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogAction 
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-gradient-primary"
          >
            {isLoading ? "جاري الإرسال..." : "تأكيد الطلب"}
          </AlertDialogAction>
          <AlertDialogCancel disabled={isLoading}>
            إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
