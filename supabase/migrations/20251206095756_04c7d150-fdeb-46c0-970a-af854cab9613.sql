-- Create table to store product translations permanently
CREATE TABLE public.shopify_product_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_handle TEXT NOT NULL UNIQUE,
  product_id TEXT,
  title_original TEXT,
  title_ar TEXT,
  description_original TEXT,
  description_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopify_product_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can view translations
CREATE POLICY "Anyone can view translations"
ON public.shopify_product_translations
FOR SELECT
USING (true);

-- Anyone can insert translations (for automatic translation storage)
CREATE POLICY "Anyone can insert translations"
ON public.shopify_product_translations
FOR INSERT
WITH CHECK (true);

-- Create index for fast lookup by handle
CREATE INDEX idx_translations_handle ON public.shopify_product_translations(product_handle);