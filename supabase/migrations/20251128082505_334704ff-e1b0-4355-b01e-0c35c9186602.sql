-- Create storage bucket for merchant documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-documents',
  'merchant-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all merchant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'merchant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all merchant documents
CREATE POLICY "Admins can view all merchant documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'merchant-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'merchant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);