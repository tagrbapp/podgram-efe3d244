-- Create announcements table for admin to manage temporary banners
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active announcements
CREATE POLICY "Anyone can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Policy: Admins can view all announcements
CREATE POLICY "Admins can view all announcements"
  ON public.announcements
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create index for better query performance
CREATE INDEX idx_announcements_active ON public.announcements(is_active, priority DESC, created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();