-- Create table for top bar settings
CREATE TABLE IF NOT EXISTS public.top_bar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Podgram - أول منصة فاخرة في المنطقة',
  delivery_text TEXT NOT NULL DEFAULT 'توصيل سريع وآمن',
  working_hours TEXT NOT NULL DEFAULT 'من 9:00 إلى 21:00',
  cta_text TEXT NOT NULL DEFAULT 'بيع منتجك',
  cta_link TEXT NOT NULL DEFAULT '/add-listing',
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  background_color TEXT DEFAULT '#1a1a1a',
  text_color TEXT DEFAULT '#ffffff',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.top_bar_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active top bar settings
CREATE POLICY "Anyone can view active top bar settings"
ON public.top_bar_settings
FOR SELECT
USING (is_active = true);

-- Only admins can manage top bar settings
CREATE POLICY "Admins can manage top bar settings"
ON public.top_bar_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.top_bar_settings (
  title,
  delivery_text,
  working_hours,
  cta_text,
  cta_link,
  phone_number
) VALUES (
  'Podgram - أول منصة فاخرة في المنطقة',
  'توصيل سريع وآمن',
  'من 9:00 إلى 21:00',
  'بيع منتجك',
  '/add-listing',
  '+966 50 123 4567'
) ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_top_bar_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_top_bar_settings_timestamp
BEFORE UPDATE ON public.top_bar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_top_bar_settings_updated_at();