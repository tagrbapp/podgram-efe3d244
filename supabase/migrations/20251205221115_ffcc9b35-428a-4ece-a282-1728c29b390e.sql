-- Create table for Shopify product analytics
CREATE TABLE public.shopify_product_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  product_title TEXT,
  views_count INTEGER DEFAULT 0,
  cart_adds_count INTEGER DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  unique_cart_adders INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create table for tracking individual events
CREATE TABLE public.shopify_product_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'cart_add', 'cart_remove', 'purchase')),
  quantity INTEGER DEFAULT 1,
  price DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_shopify_analytics_product_id ON public.shopify_product_analytics(product_id);
CREATE INDEX idx_shopify_events_product_id ON public.shopify_product_events(product_id);
CREATE INDEX idx_shopify_events_type ON public.shopify_product_events(event_type);
CREATE INDEX idx_shopify_events_created_at ON public.shopify_product_events(created_at);

-- Enable RLS
ALTER TABLE public.shopify_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_product_events ENABLE ROW LEVEL SECURITY;

-- Allow public read for analytics (admins can view)
CREATE POLICY "Anyone can view analytics" 
ON public.shopify_product_analytics 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert events
CREATE POLICY "Anyone can insert events" 
ON public.shopify_product_events 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all events
CREATE POLICY "Anyone can view events" 
ON public.shopify_product_events 
FOR SELECT 
USING (true);

-- Function to update analytics on new event
CREATE OR REPLACE FUNCTION public.update_shopify_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shopify_product_analytics (product_id, product_handle, product_title)
  VALUES (NEW.product_id, NEW.product_handle, NULL)
  ON CONFLICT (product_id) DO NOTHING;
  
  IF NEW.event_type = 'view' THEN
    UPDATE public.shopify_product_analytics 
    SET 
      views_count = views_count + 1,
      unique_viewers = (
        SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) 
        FROM public.shopify_product_events 
        WHERE product_id = NEW.product_id AND event_type = 'view'
      ),
      updated_at = now()
    WHERE product_id = NEW.product_id;
    
  ELSIF NEW.event_type = 'cart_add' THEN
    UPDATE public.shopify_product_analytics 
    SET 
      cart_adds_count = cart_adds_count + COALESCE(NEW.quantity, 1),
      unique_cart_adders = (
        SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) 
        FROM public.shopify_product_events 
        WHERE product_id = NEW.product_id AND event_type = 'cart_add'
      ),
      updated_at = now()
    WHERE product_id = NEW.product_id;
    
  ELSIF NEW.event_type = 'purchase' THEN
    UPDATE public.shopify_product_analytics 
    SET 
      purchases_count = purchases_count + 1,
      units_sold = units_sold + COALESCE(NEW.quantity, 1),
      revenue = revenue + COALESCE(NEW.price * NEW.quantity, 0),
      updated_at = now()
    WHERE product_id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_shopify_event_insert
AFTER INSERT ON public.shopify_product_events
FOR EACH ROW
EXECUTE FUNCTION public.update_shopify_analytics();