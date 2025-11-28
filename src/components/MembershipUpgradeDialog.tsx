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
import { Store, Clock } from "lucide-react";

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

      // Update membership type to merchant and set approval status to pending
      const { error } = await supabase
        .from("profiles")
        .update({
          membership_type: "merchant",
          approval_status: "pending",
          approved_at: null,
          approved_by: null
        })
        .eq("id", user.id);

      if (error) throw error;

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
      <AlertDialogContent className="text-right" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-right">
            <Store className="h-5 w-5 text-primary" />
            ترقية العضوية إلى تاجر
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-4 pt-4">
            <p className="text-foreground font-medium">
              عذراً، هذه الميزة متاحة للتجار فقط
            </p>
            <p>
              لإضافة إعلانات ومزادات، يجب أن تكون عضويتك من نوع "تاجر". 
              يمكنك طلب ترقية عضويتك الآن وسيتم مراجعة طلبك من قبل فريق الإدارة.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  مدة المراجعة
                </p>
                <p className="text-muted-foreground">
                  يستغرق التحقق من الطلب عادةً من يوم إلى 3 أيام عمل. 
                  سيتم إشعارك بمجرد الموافقة على حسابك.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogAction 
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-gradient-primary"
          >
            {isLoading ? "جاري الإرسال..." : "طلب الترقية"}
          </AlertDialogAction>
          <AlertDialogCancel disabled={isLoading}>
            إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
