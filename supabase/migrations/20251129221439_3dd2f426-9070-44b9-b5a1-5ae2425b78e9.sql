-- إضافة حقول شارات المجموعات للإعلانات
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS condition_rating NUMERIC,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- إضافة حقول شارات المجموعات للمزادات
ALTER TABLE public.auctions
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS condition_rating NUMERIC,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- إضافة قيود للتحقق من صحة البيانات
ALTER TABLE public.listings 
ADD CONSTRAINT check_listings_condition CHECK (condition IN ('new', 'used', 'refurbished', 'vintage')),
ADD CONSTRAINT check_listings_condition_rating CHECK (condition_rating IS NULL OR (condition_rating >= 0 AND condition_rating <= 10));

ALTER TABLE public.auctions
ADD CONSTRAINT check_auctions_condition CHECK (condition IN ('new', 'used', 'refurbished', 'vintage')),
ADD CONSTRAINT check_auctions_condition_rating CHECK (condition_rating IS NULL OR (condition_rating >= 0 AND condition_rating <= 10));

-- إضافة فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_is_trending ON public.listings(is_trending);
CREATE INDEX IF NOT EXISTS idx_listings_tags ON public.listings USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_auctions_condition ON public.auctions(condition);
CREATE INDEX IF NOT EXISTS idx_auctions_is_trending ON public.auctions(is_trending);
CREATE INDEX IF NOT EXISTS idx_auctions_tags ON public.auctions USING GIN(tags);