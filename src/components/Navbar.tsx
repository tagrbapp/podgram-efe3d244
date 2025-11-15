import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Plus, User, Heart } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-xl font-bold text-primary-foreground">إ</span>
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                إعلاناتي
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
                الرئيسية
              </Link>
              <Link to="/favorites" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
                المفضلة
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
                إعلاناتي
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="transition-smooth">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/add-listing">
              <Button className="gap-2 bg-gradient-secondary hover:opacity-90 transition-smooth shadow-elegant">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">أضف إعلان</span>
              </Button>
            </Link>

            <Link to="/auth">
              <Button variant="outline" size="icon" className="transition-smooth">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
