-- Create storage bucket for auction images
INSERT INTO storage.buckets (id, name, public)
VALUES ('auction-images', 'auction-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload auction images
CREATE POLICY "Admins can upload auction images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'auction-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update auction images
CREATE POLICY "Admins can update auction images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'auction-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete auction images
CREATE POLICY "Admins can delete auction images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'auction-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read access to auction images
CREATE POLICY "Anyone can view auction images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'auction-images');