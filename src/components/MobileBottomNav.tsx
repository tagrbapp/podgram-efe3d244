import { Home, Search, Gavel, Heart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "الرئيسية", path: "/" },
    { icon: Search, label: "الكتالوج", path: "/catalog" },
    { icon: Gavel, label: "المزادات", path: "/auctions" },
    { icon: Heart, label: "المفضلة", path: "/favorites" },
    { icon: User, label: "حسابي", path: "/dashboard" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
              isActive(item.path) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200",
              isActive(item.path) && "scale-110"
            )} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.path) && (
              <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
