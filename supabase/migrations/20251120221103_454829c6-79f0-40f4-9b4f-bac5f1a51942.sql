-- Add additional settings columns to homepage_sections table
ALTER TABLE public.homepage_sections
ADD COLUMN IF NOT EXISTS items_limit INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT 'bg-gray-50',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Update existing rows with default values
UPDATE public.homepage_sections
SET 
  items_limit = CASE 
    WHEN section_key = 'live_auctions' THEN 6
    WHEN section_key = 'featured_listings' THEN 12
    ELSE 12
  END,
  background_color = CASE 
    WHEN section_key = 'hero' THEN 'bg-gray-50'
    WHEN section_key = 'announcements' THEN 'bg-gray-50'
    WHEN section_key = 'live_auctions' THEN 'bg-background'
    WHEN section_key = 'featured_listings' THEN 'bg-gray-50'
    ELSE 'bg-gray-50'
  END
WHERE items_limit IS NULL OR background_color IS NULL;