import { useEffect, useState } from "react";
import { Clock, TrendingUp } from "lucide-react";

interface AuctionExtendedAlertProps {
  show: boolean;
  onClose: () => void;
}

const AuctionExtendedAlert = ({ show, onClose }: AuctionExtendedAlertProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`
          pointer-events-auto
          bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 
          text-white
          rounded-2xl shadow-2xl
          p-8 max-w-md mx-4
          border-4 border-white
          transform transition-all duration-500
          ${visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          animate-pulse
        `}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Clock className="h-20 w-20 animate-bounce" />
            <TrendingUp className="h-8 w-8 absolute -top-2 -right-2 animate-spin" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              ⏰ تمديد المزاد!
            </h2>
            <p className="text-xl font-semibold">
              تم تمديد المزاد لمدة 15 دقيقة إضافية
            </p>
            <p className="text-sm opacity-90">
              بسبب مزايدة في آخر 5 دقائق - لا تفوت الفرصة!
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="mt-4 px-6 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors"
          >
            حسناً
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionExtendedAlert;
