import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuctionReportDialogProps {
  auctionId: string;
  sellerId: string;
}

export const AuctionReportDialog = ({ auctionId, sellerId }: AuctionReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    "محتوى مخالف",
    "معلومات مضللة",
    "صور غير مناسبة",
    "احتيال محتمل",
    "سعر غير واقعي",
    "أخرى"
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("الرجاء اختيار سبب البلاغ");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: sellerId,
          listing_id: null, // المزاد ليس له listing_id مباشر
          reason,
          description: description || null
        });

      if (error) throw error;

      toast.success("تم إرسال البلاغ بنجاح. سيتم مراجعته من قبل الإدارة");
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("فشل إرسال البلاغ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          الإبلاغ عن مخالفة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن مخالفة</DialogTitle>
          <DialogDescription>
            إذا كنت تعتقد أن هذا المزاد يخالف سياسة الموقع، يرجى تحديد السبب أدناه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>سبب البلاغ</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="cursor-pointer flex-1 text-right">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>تفاصيل إضافية (اختياري)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="يرجى تقديم معلومات إضافية تساعد في مراجعة البلاغ..."
              className="min-h-[100px]"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-start">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            {isSubmitting ? "جاري الإرسال..." : "إرسال البلاغ"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
