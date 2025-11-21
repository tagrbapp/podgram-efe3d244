import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeSettings {
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  secondary_hue: number;
  secondary_saturation: number;
  secondary_lightness: number;
  background_hue: number;
  background_saturation: number;
  background_lightness: number;
  card_hue: number;
  card_saturation: number;
  card_lightness: number;
  foreground_hue: number;
  foreground_saturation: number;
  foreground_lightness: number;
  accent_hue: number;
  accent_saturation: number;
  accent_lightness: number;
  muted_hue: number;
  muted_saturation: number;
  muted_lightness: number;
  border_hue: number;
  border_saturation: number;
  border_lightness: number;
  destructive_hue: number;
  destructive_saturation: number;
  destructive_lightness: number;
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    fetchAndApplyTheme();
    
    // Subscribe to theme changes
    const channel = supabase
      .channel('theme_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theme_settings'
        },
        () => {
          fetchAndApplyTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAndApplyTheme = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (data) {
        applyTheme(data);
        setThemeLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      setThemeLoaded(true);
    }
  };

  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;

    // Apply primary color
    root.style.setProperty('--primary', `${settings.primary_hue} ${settings.primary_saturation}% ${settings.primary_lightness}%`);
    root.style.setProperty('--primary-foreground', `${settings.primary_hue} ${settings.primary_saturation}% ${settings.primary_lightness > 50 ? 10 : 98}%`);

    // Apply secondary color
    root.style.setProperty('--secondary', `${settings.secondary_hue} ${settings.secondary_saturation}% ${settings.secondary_lightness}%`);
    root.style.setProperty('--secondary-foreground', `${settings.secondary_hue} ${settings.secondary_saturation}% ${settings.secondary_lightness > 50 ? 10 : 98}%`);

    // Apply background
    root.style.setProperty('--background', `${settings.background_hue} ${settings.background_saturation}% ${settings.background_lightness}%`);
    
    // Apply foreground (text)
    root.style.setProperty('--foreground', `${settings.foreground_hue} ${settings.foreground_saturation}% ${settings.foreground_lightness}%`);

    // Apply card
    root.style.setProperty('--card', `${settings.card_hue} ${settings.card_saturation}% ${settings.card_lightness}%`);
    root.style.setProperty('--card-foreground', `${settings.foreground_hue} ${settings.foreground_saturation}% ${settings.foreground_lightness}%`);

    // Apply accent
    root.style.setProperty('--accent', `${settings.accent_hue} ${settings.accent_saturation}% ${settings.accent_lightness}%`);
    root.style.setProperty('--accent-foreground', `${settings.accent_hue} ${settings.accent_saturation}% ${settings.accent_lightness > 50 ? 10 : 98}%`);

    // Apply muted
    root.style.setProperty('--muted', `${settings.muted_hue} ${settings.muted_saturation}% ${settings.muted_lightness}%`);
    root.style.setProperty('--muted-foreground', `${settings.foreground_hue} ${settings.foreground_saturation}% ${Math.min(settings.foreground_lightness + 35, 60)}%`);

    // Apply border
    root.style.setProperty('--border', `${settings.border_hue} ${settings.border_saturation}% ${settings.border_lightness}%`);
    root.style.setProperty('--input', `${settings.border_hue} ${settings.border_saturation}% ${settings.border_lightness}%`);
    root.style.setProperty('--ring', `${settings.primary_hue} ${settings.primary_saturation}% ${settings.primary_lightness}%`);

    // Apply destructive
    root.style.setProperty('--destructive', `${settings.destructive_hue} ${settings.destructive_saturation}% ${settings.destructive_lightness}%`);
    root.style.setProperty('--destructive-foreground', `0 0% 98%`);
  };

  if (!themeLoaded) {
    return null;
  }

  return <>{children}</>;
};
