-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'favorite_added', 'listing_viewed', etc.
  listing_id UUID,
  related_user_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.listings(id) 
  ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to send notification when someone adds listing to favorites
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
  favoriter_name TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner_id, listing_title
  FROM public.listings
  WHERE id = NEW.listing_id;
  
  -- Get the name of the user who favorited
  SELECT full_name INTO favoriter_name
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if user favorites their own listing
  IF listing_owner_id != NEW.user_id THEN
    -- Insert notification
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      listing_id,
      related_user_id
    ) VALUES (
      listing_owner_id,
      'تم إضافة إعلانك للمفضلة',
      'قام ' || COALESCE(favoriter_name, 'مستخدم') || ' بإضافة إعلانك "' || listing_title || '" إلى المفضلة',
      'favorite_added',
      NEW.listing_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for favorite notifications
CREATE TRIGGER on_favorite_added
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_favorite();

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);