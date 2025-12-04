-- Add aliexpress_products section to homepage_sections if not exists
INSERT INTO public.homepage_sections (section_key, section_name, is_visible, display_order, items_limit, background_color)
SELECT 'aliexpress_products', 'منتجات AliExpress', true, 6, 8, 'bg-background'
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_sections WHERE section_key = 'aliexpress_products'
);