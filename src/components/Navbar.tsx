import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, Heart } from "lucide-react";
import { Notifications } from "@/components/Notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import TopBar from "@/components/TopBar";
import SearchBar from "@/components/SearchBar";
import podgramLogo from "@/assets/podgram-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("حدث خطأ في تسجيل الخروج");
    } else {
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/");
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(" ");
      if (names.length >= 2) {
        return names[0][0] + names[1][0];
      }
      return names[0][0];
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <TopBar />
      <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img src={podgramLogo} alt="Podgram" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold text-qultura-blue hidden sm:inline">
                Podgram
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <Link to="/about" className="text-gray-600 hover:text-qultura-blue transition-smooth">
                عن الشركة
              </Link>
              <Link to="/delivery" className="text-gray-600 hover:text-qultura-blue transition-smooth">
                التوصيل
              </Link>
              <Link to="/pickup" className="text-gray-600 hover:text-qultura-blue transition-smooth">
                الاستلام
              </Link>
              <Link to="/trade-in" className="text-gray-600 hover:text-qultura-blue transition-smooth">
                استبدال
              </Link>

              <Button
                className="bg-qultura-blue hover:bg-qultura-blue/90 text-white px-6 h-12"
                asChild
              >
                <Link to="/catalog">
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  الكتالوج
                </Link>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl justify-center">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
              />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" className="hover:bg-gray-100 transition-smooth">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
              </Button>

              <Notifications />

              <Link to="/favorites">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 transition-smooth">
                  <Heart className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="bg-qultura-blue text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || "مستخدم"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      إعلاناتي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/favorites")}>
                      المفضلة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      الإعدادات
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button className="bg-qultura-blue hover:bg-qultura-blue/90 transition-smooth">
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

