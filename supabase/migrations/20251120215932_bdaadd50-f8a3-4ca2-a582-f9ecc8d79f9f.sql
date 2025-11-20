-- Create homepage_sections table for managing section visibility
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default sections
INSERT INTO public.homepage_sections (section_key, section_name, display_order) VALUES
  ('hero', 'قسم Hero الرئيسي', 1),
  ('announcements', 'الإعلانات والبانرات', 2),
  ('live_auctions', 'المزادات المباشرة', 3),
  ('featured_listings', 'الإعلانات المميزة', 4)
ON CONFLICT (section_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage sections"
  ON public.homepage_sections
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view sections"
  ON public.homepage_sections
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();