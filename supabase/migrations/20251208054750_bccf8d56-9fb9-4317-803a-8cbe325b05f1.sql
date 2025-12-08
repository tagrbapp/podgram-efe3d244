-- Add new columns to carousel_slides for full hero customization
ALTER TABLE public.carousel_slides 
ADD COLUMN IF NOT EXISTS badge_text text DEFAULT '🏆 منصة المزادات الأولى في المملكة',
ADD COLUMN IF NOT EXISTS cta_primary_text text DEFAULT 'سجّل الآن مجاناً',
ADD COLUMN IF NOT EXISTS cta_primary_link text DEFAULT '/auth',
ADD COLUMN IF NOT EXISTS cta_secondary_text text DEFAULT 'تصفح المزادات',
ADD COLUMN IF NOT EXISTS cta_secondary_link text DEFAULT '/auctions',
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[
  {"value": "+500", "label": "مزاد نشط"},
  {"value": "+10K", "label": "مستخدم مسجل"},
  {"value": "+2M", "label": "ريال قيمة المبيعات"}
]'::jsonb;

-- Update existing slides with default values
UPDATE public.carousel_slides 
SET 
  badge_text = COALESCE(badge_text, '🏆 منصة المزادات الأولى في المملكة'),
  cta_primary_text = COALESCE(cta_primary_text, 'سجّل الآن مجاناً'),
  cta_primary_link = COALESCE(cta_primary_link, '/auth'),
  cta_secondary_text = COALESCE(cta_secondary_text, 'تصفح المزادات'),
  cta_secondary_link = COALESCE(cta_secondary_link, '/auctions'),
  stats = COALESCE(stats, '[{"value": "+500", "label": "مزاد نشط"}, {"value": "+10K", "label": "مستخدم مسجل"}, {"value": "+2M", "label": "ريال قيمة المبيعات"}]'::jsonb)
WHERE badge_text IS NULL;