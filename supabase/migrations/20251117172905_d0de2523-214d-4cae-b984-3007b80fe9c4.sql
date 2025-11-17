-- Create carousel_slides table
CREATE TABLE public.carousel_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  bg_color TEXT NOT NULL DEFAULT 'from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
ON public.carousel_slides
FOR SELECT
USING (is_active = true OR auth.uid() IS NOT NULL);

-- Admins can manage slides
CREATE POLICY "Admins can manage slides"
ON public.carousel_slides
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_carousel_slides_updated_at
BEFORE UPDATE ON public.carousel_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default slides
INSERT INTO public.carousel_slides (title, subtitle, description, bg_color, display_order) VALUES
('Largest selection of', 'luxury brands', 'أكثر من 249 علامة فاخرة على المنصة', 'from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]', 1),
('Exclusive collection of', 'designer items', 'مجموعة حصرية من العلامات الفاخرة', 'from-[hsl(var(--qultura-blue))] to-[hsl(219,78%,46%)]', 2),
('Premium quality', 'authentic luxury', 'جودة ممتازة وأصالة مضمونة', 'from-[hsl(25,95%,58%)] to-[hsl(25,95%,48%)]', 3);