import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const AccountApprovalBanner = () => {
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("id", user.id)
        .single();

      if (profile) {
        setApprovalStatus(profile.approval_status);
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !approvalStatus || approvalStatus === "approved") {
    return null;
  }

  if (approvalStatus === "pending") {
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          حسابك قيد المراجعة
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          شكراً لتسجيلك! حسابك قيد المراجعة من قبل إدارة الموقع. 
          ستتمكن من إضافة المزادات والإعلانات بعد الموافقة على حسابك.
          سيتم إشعارك فور الموافقة.
        </AlertDescription>
      </Alert>
    );
  }

  if (approvalStatus === "rejected") {
    return (
      <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
        <XCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200">
          لم تتم الموافقة على حسابك
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          نعتذر، لم تتم الموافقة على طلب انضمامك للمنصة.
          للمزيد من المعلومات، يرجى التواصل مع إدارة الموقع.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
