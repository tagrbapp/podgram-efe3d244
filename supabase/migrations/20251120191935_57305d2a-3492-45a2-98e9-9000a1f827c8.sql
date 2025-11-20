-- إضافة عمود الفئة لجدول المزادات وجعل listing_id اختياري
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ALTER COLUMN listing_id DROP NOT NULL;

-- إضافة فهرس للفئة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_auctions_category_id ON auctions(category_id);