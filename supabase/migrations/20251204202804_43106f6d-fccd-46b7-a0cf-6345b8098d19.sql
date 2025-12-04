-- Add CJdropshipping products section to homepage_sections
INSERT INTO public.homepage_sections (section_key, section_name, is_visible, display_order, items_limit, background_color)
VALUES ('cjdropshipping_products', 'منتجات CJdropshipping', true, 7, 8, 'bg-background')
ON CONFLICT (section_key) DO NOTHING;