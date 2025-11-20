-- إضافة عمود user_id لجدول المزادات
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- تحديث المزادات الموجودة لنسخ user_id من الإعلانات
UPDATE auctions a
SET user_id = l.user_id
FROM listings l
WHERE a.listing_id = l.id AND a.user_id IS NULL;

-- إضافة فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_auctions_user_id ON auctions(user_id);