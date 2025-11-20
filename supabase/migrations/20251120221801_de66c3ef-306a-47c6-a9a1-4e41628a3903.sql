-- Create homepage section history table
CREATE TABLE IF NOT EXISTS public.homepage_section_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.homepage_sections(id) ON DELETE CASCADE,
  changed_by UUID,
  items_limit INTEGER,
  background_color TEXT,
  is_visible BOOLEAN,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_section_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history
CREATE POLICY "Admins can view history"
ON public.homepage_section_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_homepage_section_history_section_id ON public.homepage_section_history(section_id);
CREATE INDEX idx_homepage_section_history_created_at ON public.homepage_section_history(created_at DESC);

-- Create trigger to save history on updates
CREATE OR REPLACE FUNCTION save_homepage_section_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.homepage_section_history (
    section_id,
    changed_by,
    items_limit,
    background_color,
    is_visible,
    settings
  ) VALUES (
    NEW.id,
    NEW.updated_by,
    NEW.items_limit,
    NEW.background_color,
    NEW.is_visible,
    NEW.settings
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

CREATE TRIGGER homepage_section_history_trigger
AFTER UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION save_homepage_section_history();