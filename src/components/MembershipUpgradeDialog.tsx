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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Clock, Building2, FileText, Briefcase, Upload } from "lucide-react";

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
  const [businessName, setBusinessName] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن لا يتجاوز 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("نوع الملف يجب أن يكون صورة أو PDF");
      return;
    }

    setIdDocument(file);
  };

  const uploadDocument = async (userId: string): Promise<string | null> => {
    if (!idDocument) return null;

    setUploading(true);
    try {
      const fileExt = idDocument.name.split('.').pop();
      const fileName = `${userId}/id_document_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('merchant-documents')
        .upload(fileName, idDocument);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('merchant-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleUpgrade = async () => {
    // Validate required fields
    if (!businessName || !commercialRegistration || !businessType) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

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

      // Upload document if provided
      let documentUrl = null;
      if (idDocument) {
        toast.info("جاري رفع الوثيقة...");
        documentUrl = await uploadDocument(user.id);
      }

      // Update profile with merchant information
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          membership_type: "merchant",
          approval_status: "pending",
          approved_at: null,
          approved_by: null,
          business_name: businessName,
          commercial_registration: commercialRegistration,
          business_type: businessType,
          business_description: businessDescription,
          id_document_url: documentUrl,
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
            to_status: "pending",
            business_name: businessName,
            commercial_registration: commercialRegistration,
            business_type: businessType,
            business_description: businessDescription
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
      <AlertDialogContent className="text-right max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-right">
            <Store className="h-5 w-5 text-primary" />
            طلب ترقية العضوية إلى تاجر
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-4 pt-4">
            <p className="text-foreground font-medium">
              يرجى تعبئة البيانات التالية للتحقق من هوية التاجر
            </p>
            
            <div className="space-y-4 mt-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  اسم المنشأة / العلامة التجارية *
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="مثال: مؤسسة التجارة الذهبية"
                  className="text-right"
                  disabled={isLoading || uploading}
                />
              </div>

              {/* Commercial Registration */}
              <div className="space-y-2">
                <Label htmlFor="commercialRegistration" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  رقم السجل التجاري *
                </Label>
                <Input
                  id="commercialRegistration"
                  value={commercialRegistration}
                  onChange={(e) => setCommercialRegistration(e.target.value)}
                  placeholder="1234567890"
                  className="text-right"
                  disabled={isLoading || uploading}
                />
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label htmlFor="businessType" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  نوع النشاط التجاري *
                </Label>
                <Select value={businessType} onValueChange={setBusinessType} disabled={isLoading || uploading}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر نوع النشاط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jewelry">مجوهرات وذهب</SelectItem>
                    <SelectItem value="watches">ساعات فاخرة</SelectItem>
                    <SelectItem value="bags">حقائب وإكسسوارات</SelectItem>
                    <SelectItem value="fashion">أزياء راقية</SelectItem>
                    <SelectItem value="antiques">تحف ومقتنيات</SelectItem>
                    <SelectItem value="electronics">إلكترونيات فاخرة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Business Description */}
              <div className="space-y-2">
                <Label htmlFor="businessDescription">
                  وصف النشاط التجاري (اختياري)
                </Label>
                <Textarea
                  id="businessDescription"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="اكتب وصفاً مختصراً عن نشاطك التجاري..."
                  className="text-right min-h-20"
                  disabled={isLoading || uploading}
                />
              </div>

              {/* ID Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="idDocument" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  صورة الهوية أو السجل التجاري (اختياري)
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-smooth cursor-pointer">
                  <input
                    type="file"
                    id="idDocument"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading || uploading}
                  />
                  <label htmlFor="idDocument" className="cursor-pointer">
                    {idDocument ? (
                      <p className="text-sm text-foreground">{idDocument.name}</p>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          انقر لاختيار ملف
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          صورة أو PDF (حتى 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 mt-4">
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
            disabled={isLoading || uploading || !businessName || !commercialRegistration || !businessType}
            className="bg-gradient-primary"
          >
            {uploading ? "جاري رفع الملف..." : isLoading ? "جاري الإرسال..." : "إرسال الطلب"}
          </AlertDialogAction>
          <AlertDialogCancel disabled={isLoading || uploading}>
            إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
