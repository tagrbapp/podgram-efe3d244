-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- سياسات RLS للـ bucket
-- السماح للجميع بقراءة الصور
CREATE POLICY "الجميع يمكنهم رؤية صور الإعلانات"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- السماح للمستخدمين المسجلين برفع الصور
CREATE POLICY "المستخدمون المسجلون يمكنهم رفع الصور"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- السماح للمستخدمين بتحديث صورهم فقط
CREATE POLICY "المستخدمون يمكنهم تحديث صورهم"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- السماح للمستخدمين بحذف صورهم فقط
CREATE POLICY "المستخدمون يمكنهم حذف صورهم"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);