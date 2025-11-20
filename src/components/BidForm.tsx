import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gavel, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { convertArabicToEnglishNumbers } from "@/lib/utils";
import QuickBidButtons from "./QuickBidButtons";

interface BidFormProps {
  auctionId: string;
  currentBid: number | null;
  startingPrice: number;
  bidIncrement: number;
  onBidPlaced: () => void;
}

const BidForm = ({
  auctionId,
  currentBid,
  startingPrice,
  bidIncrement,
  onBidPlaced,
}: BidFormProps) => {
  const minBid = currentBid ? currentBid + bidIncrement : startingPrice;
  const [bidAmount, setBidAmount] = useState<string>(minBid.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول للمزايدة");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount < minBid) {
      toast.error(`الحد الأدنى للمزايدة هو ${minBid.toLocaleString("ar-SA")} ريال`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("place_bid", {
        _auction_id: auctionId,
        _user_id: user.id,
        _bid_amount: amount,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        toast.success("تم تقديم عرضك بنجاح! 🎉");
        onBidPlaced();
      } else {
        toast.error(result.error || "فشل تقديم العرض");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      toast.error("حدث خطأ أثناء تقديم العرض");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Gavel className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">قدم عرضك</h3>
            <p className="text-xs text-muted-foreground">اختر مبلغاً أو أدخل عرضك المخصص</p>
          </div>
        </div>

      <QuickBidButtons
        minBid={minBid}
        bidIncrement={bidIncrement}
        onBidSelect={handleQuickBid}
      />

      <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-border/50">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            أو أدخل مبلغك المخصص (ريال)
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={bidAmount}
              onChange={(e) => setBidAmount(convertArabicToEnglishNumbers(e.target.value))}
              className="text-2xl font-bold h-14 text-center bg-muted/50 border-2 border-border/50 focus:border-primary rounded-xl"
              disabled={isSubmitting}
              placeholder={minBid.toLocaleString("ar-SA")}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            الحد الأدنى للمزايدة: <span className="font-bold text-primary">{minBid.toLocaleString("ar-SA")} ريال</span>
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-primary-foreground font-bold h-14 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2" />
              جاري التقديم...
            </>
          ) : (
            <>
              <TrendingUp className="h-6 w-6 ml-2" />
              تقديم العرض الآن
            </>
          )}
        </Button>
      </form>
    </div>
    </div>
  );
};

export default BidForm;
