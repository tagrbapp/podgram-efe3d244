-- Create table for CJdropshipping products
CREATE TABLE public.cjdropshipping_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cj_product_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500),
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2),
  discount_percentage INTEGER,
  currency VARCHAR(10) DEFAULT 'SAR',
  images TEXT[],
  product_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  seller_name VARCHAR(255),
  seller_rating DECIMAL(3,2),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  shipping_time VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cjdropshipping_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active CJ products" 
ON public.cjdropshipping_products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage CJ products" 
ON public.cjdropshipping_products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create index for performance
CREATE INDEX idx_cjdropshipping_products_category ON public.cjdropshipping_products(category_id);
CREATE INDEX idx_cjdropshipping_products_active ON public.cjdropshipping_products(is_active);
CREATE INDEX idx_cjdropshipping_products_imported_at ON public.cjdropshipping_products(imported_at DESC);