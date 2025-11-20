-- إضافة أعمدة تفاصيل المزاد
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[];

-- تحديث المزادات الموجودة لنسخ البيانات من الإعلانات
UPDATE auctions a
SET 
  title = l.title,
  description = l.description,
  images = l.images
FROM listings l
WHERE a.listing_id = l.id AND a.title IS NULL;