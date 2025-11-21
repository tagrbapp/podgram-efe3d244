import { Phone, Clock, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TopBarSettings {
  title: string;
  delivery_text: string;
  working_hours: string;
  cta_text: string;
  cta_link: string;
  phone_number: string | null;
  background_color: string;
  text_color: string;
}

const TopBar = () => {
  const [settings, setSettings] = useState<TopBarSettings>({
    title: "Podgram - أول منصة فاخرة في المنطقة",
    delivery_text: "توصيل سريع وآمن",
    working_hours: "من 9:00 إلى 21:00",
    cta_text: "بيع منتجك",
    cta_link: "/add-listing",
    phone_number: null,
    background_color: "#1a1a1a",
    text_color: "#ffffff",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("top_bar_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (data) {
      setSettings(data);
    }
  };

  return (
    <div 
      className="w-full border-b"
      style={{
        backgroundColor: settings.background_color,
        color: settings.text_color,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10 text-xs">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="font-medium whitespace-nowrap">{settings.title}</span>
            <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <Truck className="h-3.5 w-3.5" />
              {settings.delivery_text}
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            {settings.phone_number && (
              <a 
                href={`tel:${settings.phone_number}`}
                className="hidden md:flex items-center gap-1.5 hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{settings.phone_number}</span>
              </a>
            )}
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{settings.working_hours}</span>
            </div>
            <Link 
              to={settings.cta_link} 
              className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all font-medium whitespace-nowrap"
            >
              {settings.cta_text}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
