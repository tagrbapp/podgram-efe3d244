-- Add homepage_image column to auctions table
ALTER TABLE public.auctions 
ADD COLUMN IF NOT EXISTS homepage_image text;