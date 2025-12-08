-- Add new fields for hero carousel customization
ALTER TABLE public.carousel_slides
ADD COLUMN IF NOT EXISTS title_color text DEFAULT '#1a1a1a',
ADD COLUMN IF NOT EXISTS subtitle_color text DEFAULT '#06b6d4',
ADD COLUMN IF NOT EXISTS description_color text DEFAULT '#6b7280',
ADD COLUMN IF NOT EXISTS floating_image_url text,
ADD COLUMN IF NOT EXISTS show_floating_card boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cta_primary_bg_color text DEFAULT '#0891b2',
ADD COLUMN IF NOT EXISTS cta_primary_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS cta_secondary_bg_color text DEFAULT 'transparent',
ADD COLUMN IF NOT EXISTS cta_secondary_text_color text DEFAULT '#1a1a1a',
ADD COLUMN IF NOT EXISTS cta_secondary_border_color text DEFAULT '#1a1a1a';