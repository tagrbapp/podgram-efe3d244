import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gavel, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Gavel className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">قدم عرضك</h3>
        </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickBid(minBid)}
          className="text-xs"
        >
          الحد الأدنى
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickBid(minBid + bidIncrement)}
          className="text-xs"
        >
          +{bidIncrement}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickBid(minBid + bidIncrement * 2)}
          className="text-xs"
        >
          +{bidIncrement * 2}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            المبلغ (ريال)
          </label>
          <Input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            min={minBid}
            step={bidIncrement}
            className="text-lg font-bold"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-2">
            الحد الأدنى: {minBid.toLocaleString("ar-SA")} ريال
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold h-12 text-base rounded-xl shadow-lg"
          disabled={isSubmitting}
        >
          <TrendingUp className="h-5 w-5 ml-2" />
          {isSubmitting ? "جاري التقديم..." : "تقديم العرض"}
        </Button>
      </form>
    </div>
    </div>
  );
};

export default BidForm;
