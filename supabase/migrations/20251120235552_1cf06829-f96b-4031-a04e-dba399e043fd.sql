-- Create footer_settings table
CREATE TABLE public.footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Brand Section
  brand_name TEXT NOT NULL DEFAULT 'Podgram',
  brand_description TEXT NOT NULL DEFAULT 'المنصة الأولى للمنتجات الفاخرة في المنطقة. نجمع بين البائعين والمشترين في سوق آمن وموثوق.',
  
  -- Social Media Links
  facebook_url TEXT DEFAULT 'https://facebook.com',
  instagram_url TEXT DEFAULT 'https://instagram.com',
  twitter_url TEXT DEFAULT 'https://twitter.com',
  linkedin_url TEXT DEFAULT 'https://linkedin.com',
  youtube_url TEXT DEFAULT 'https://youtube.com',
  
  -- Contact Information
  phone TEXT DEFAULT '+966 50 123 4567',
  email TEXT DEFAULT 'info@podgram.com',
  address TEXT DEFAULT 'الرياض، المملكة العربية السعودية',
  
  -- Bottom Bar
  copyright_text TEXT DEFAULT 'Podgram. جميع الحقوق محفوظة.',
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT single_active_footer CHECK (is_active = true)
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active footer settings
CREATE POLICY "Anyone can view active footer settings"
  ON public.footer_settings
  FOR SELECT
  USING (is_active = true);

-- Admins can manage footer settings
CREATE POLICY "Admins can manage footer settings"
  ON public.footer_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO public.footer_settings (
  brand_name,
  brand_description,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
  youtube_url,
  phone,
  email,
  address,
  copyright_text
) VALUES (
  'Podgram',
  'المنصة الأولى للمنتجات الفاخرة في المنطقة. نجمع بين البائعين والمشترين في سوق آمن وموثوق.',
  'https://facebook.com',
  'https://instagram.com',
  'https://twitter.com',
  'https://linkedin.com',
  'https://youtube.com',
  '+966 50 123 4567',
  'info@podgram.com',
  'الرياض، المملكة العربية السعودية',
  'Podgram. جميع الحقوق محفوظة.'
);

-- Create function to update footer_settings updated_at
CREATE OR REPLACE FUNCTION public.update_footer_settings_updated_at()
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
CREATE TRIGGER update_footer_settings_updated_at
  BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_footer_settings_updated_at();