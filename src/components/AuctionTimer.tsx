import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface AuctionTimerProps {
  endTime: string;
  onExpire?: () => void;
}

const AuctionTimer = ({ endTime, onExpire }: AuctionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft("انتهى المزاد");
        setIsExpired(true);
        onExpire?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days} يوم ${hours} ساعة`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} ساعة ${minutes} دقيقة`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes} دقيقة ${seconds} ثانية`);
      } else {
        setTimeLeft(`${seconds} ثانية`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 ${
        isExpired
          ? "bg-muted border-muted-foreground/20"
          : "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 animate-pulse"
      }`}
    >
      <Clock className={`h-5 w-5 ${isExpired ? "text-muted-foreground" : "text-primary"}`} />
      <div>
        <p className="text-xs text-muted-foreground">الوقت المتبقي</p>
        <p className={`text-lg font-bold ${isExpired ? "text-muted-foreground" : "text-primary"}`}>
          {timeLeft}
        </p>
      </div>
    </div>
  );
};

export default AuctionTimer;
