-- Add link color field to footer_settings table
ALTER TABLE public.footer_settings 
ADD COLUMN IF NOT EXISTS link_color VARCHAR(20) DEFAULT '#9CA3AF';

-- Update existing rows with default value
UPDATE public.footer_settings SET link_color = '#9CA3AF' WHERE link_color IS NULL;