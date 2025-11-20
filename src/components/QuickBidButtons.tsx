import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Flame } from "lucide-react";

interface QuickBidButtonsProps {
  minBid: number;
  bidIncrement: number;
  onBidSelect: (amount: number) => void;
}

const QuickBidButtons = ({ minBid, bidIncrement, onBidSelect }: QuickBidButtonsProps) => {
  const quickBids = [
    { label: "الحد الأدنى", amount: minBid, icon: TrendingUp, variant: "outline" as const },
    { label: `+${bidIncrement}`, amount: minBid + bidIncrement, icon: Zap, variant: "secondary" as const },
    { label: `+${bidIncrement * 2}`, amount: minBid + bidIncrement * 2, icon: Flame, variant: "default" as const },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {quickBids.map((bid, index) => {
        const Icon = bid.icon;
        return (
          <Button
            key={index}
            variant={bid.variant}
            size="sm"
            onClick={() => onBidSelect(bid.amount)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{bid.label}</span>
            <span className="text-xs font-bold">
              {bid.amount.toLocaleString("ar-SA")}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default QuickBidButtons;
