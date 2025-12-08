-- Create promotional banners table
CREATE TABLE public.promotional_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active banners"
ON public.promotional_banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.promotional_banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_promotional_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default banners
INSERT INTO public.promotional_banners (title, image_url, link_url, position) VALUES
('بنر 1', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', '/catalog', 1),
('بنر 2', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop', '/auctions', 2),
('بنر 3', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop', '/auth', 3),
('بنر جانبي', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=800&fit=crop', '/add-listing', 4);