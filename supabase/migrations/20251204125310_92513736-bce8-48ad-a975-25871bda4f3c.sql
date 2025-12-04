-- Create table for AliExpress imported products
CREATE TABLE public.aliexpress_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aliexpress_product_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  discount_percentage INTEGER,
  currency TEXT DEFAULT 'SAR',
  images TEXT[] DEFAULT '{}',
  product_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  seller_name TEXT,
  seller_rating NUMERIC,
  shipping_cost NUMERIC DEFAULT 0,
  shipping_time TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aliexpress_products ENABLE ROW LEVEL SECURITY;

-- Admin/Moderator can manage all products
CREATE POLICY "Admins can manage aliexpress products"
ON public.aliexpress_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

-- Authenticated users can view active products
CREATE POLICY "Users can view active aliexpress products"
ON public.aliexpress_products
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_aliexpress_products_updated_at
  BEFORE UPDATE ON public.aliexpress_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_aliexpress_products_active ON public.aliexpress_products(is_active);
CREATE INDEX idx_aliexpress_products_category ON public.aliexpress_products(category_id);