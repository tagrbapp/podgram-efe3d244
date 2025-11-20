import { Phone } from "lucide-react";
import { Link } from "react-router-dom";

const TopBar = () => {
  return (
    <div className="w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10 text-xs text-gray-600">
          <div className="flex items-center gap-6">
            <span>Podgram - أول منصة فاخرة في المنطقة</span>
            <span className="hidden md:inline">توصيل سريع وآمن</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span>من 9:00 إلى 21:00</span>
            </div>
            <Link to="/dashboard" className="hover:text-qultura-blue transition-smooth">
              بيع منتجك
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
