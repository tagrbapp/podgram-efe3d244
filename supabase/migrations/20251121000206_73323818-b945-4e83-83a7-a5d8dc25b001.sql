-- Create theme_settings table
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Primary Colors (HSL format)
  primary_hue INTEGER NOT NULL DEFAULT 162,
  primary_saturation INTEGER NOT NULL DEFAULT 60,
  primary_lightness INTEGER NOT NULL DEFAULT 45,
  
  -- Secondary Colors
  secondary_hue INTEGER NOT NULL DEFAULT 162,
  secondary_saturation INTEGER NOT NULL DEFAULT 50,
  secondary_lightness INTEGER NOT NULL DEFAULT 35,
  
  -- Background Colors
  background_hue INTEGER NOT NULL DEFAULT 0,
  background_saturation INTEGER NOT NULL DEFAULT 0,
  background_lightness INTEGER NOT NULL DEFAULT 100,
  
  -- Card/Surface Colors
  card_hue INTEGER NOT NULL DEFAULT 0,
  card_saturation INTEGER NOT NULL DEFAULT 0,
  card_lightness INTEGER NOT NULL DEFAULT 100,
  
  -- Text Colors
  foreground_hue INTEGER NOT NULL DEFAULT 0,
  foreground_saturation INTEGER NOT NULL DEFAULT 0,
  foreground_lightness INTEGER NOT NULL DEFAULT 10,
  
  -- Accent Colors
  accent_hue INTEGER NOT NULL DEFAULT 162,
  accent_saturation INTEGER NOT NULL DEFAULT 55,
  accent_lightness INTEGER NOT NULL DEFAULT 50,
  
  -- Muted Colors
  muted_hue INTEGER NOT NULL DEFAULT 0,
  muted_saturation INTEGER NOT NULL DEFAULT 0,
  muted_lightness INTEGER NOT NULL DEFAULT 96,
  
  -- Border Colors
  border_hue INTEGER NOT NULL DEFAULT 0,
  border_saturation INTEGER NOT NULL DEFAULT 0,
  border_lightness INTEGER NOT NULL DEFAULT 90,
  
  -- Destructive Colors
  destructive_hue INTEGER NOT NULL DEFAULT 0,
  destructive_saturation INTEGER NOT NULL DEFAULT 84,
  destructive_lightness INTEGER NOT NULL DEFAULT 60,
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  theme_name TEXT NOT NULL DEFAULT 'Default Theme',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT single_active_theme CHECK (is_active = true)
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active theme settings
CREATE POLICY "Anyone can view active theme settings"
  ON public.theme_settings
  FOR SELECT
  USING (is_active = true);

-- Admins can manage theme settings
CREATE POLICY "Admins can manage theme settings"
  ON public.theme_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default theme settings (current Podgram theme)
INSERT INTO public.theme_settings (
  theme_name,
  primary_hue, primary_saturation, primary_lightness,
  secondary_hue, secondary_saturation, secondary_lightness,
  background_hue, background_saturation, background_lightness,
  card_hue, card_saturation, card_lightness,
  foreground_hue, foreground_saturation, foreground_lightness,
  accent_hue, accent_saturation, accent_lightness,
  muted_hue, muted_saturation, muted_lightness,
  border_hue, border_saturation, border_lightness,
  destructive_hue, destructive_saturation, destructive_lightness
) VALUES (
  'Podgram Default',
  162, 60, 45,  -- primary (qultura-green)
  162, 50, 35,  -- secondary
  0, 0, 100,    -- background (white)
  0, 0, 100,    -- card (white)
  0, 0, 10,     -- foreground (dark text)
  162, 55, 50,  -- accent
  0, 0, 96,     -- muted
  0, 0, 90,     -- border
  0, 84, 60     -- destructive (red)
);

-- Create function to update theme_settings updated_at
CREATE OR REPLACE FUNCTION public.update_theme_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_theme_settings_updated_at();