-- Create auto_bids table for automatic bidding system
CREATE TABLE public.auto_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_bid_amount NUMERIC NOT NULL,
  current_proxy_bid NUMERIC DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

-- Enable RLS on auto_bids
ALTER TABLE public.auto_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_bids
CREATE POLICY "Users can view their own auto bids"
  ON public.auto_bids
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own auto bids"
  ON public.auto_bids
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto bids"
  ON public.auto_bids
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto bids"
  ON public.auto_bids
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create push_subscriptions table for browser push notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to process auto bids when a new bid is placed
CREATE OR REPLACE FUNCTION public.process_auto_bids()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auction RECORD;
  _auto_bid RECORD;
  _new_bid_amount NUMERIC;
  _bidder_name TEXT;
  _listing_title TEXT;
  _listing_owner_id UUID;
BEGIN
  -- Get auction details
  SELECT * INTO _auction
  FROM public.auctions
  WHERE id = NEW.auction_id;
  
  -- Get listing info
  SELECT user_id, title INTO _listing_owner_id, _listing_title
  FROM public.listings
  WHERE id = _auction.listing_id;
  
  -- Process all active auto bids for this auction, excluding the user who just bid
  FOR _auto_bid IN 
    SELECT * FROM public.auto_bids
    WHERE auction_id = NEW.auction_id
      AND user_id != NEW.user_id
      AND is_active = true
      AND max_bid_amount > NEW.bid_amount
    ORDER BY max_bid_amount DESC, created_at ASC
  LOOP
    -- Calculate new bid amount (current bid + increment)
    _new_bid_amount := NEW.bid_amount + _auction.bid_increment;
    
    -- Don't exceed user's max bid
    IF _new_bid_amount > _auto_bid.max_bid_amount THEN
      _new_bid_amount := _auto_bid.max_bid_amount;
    END IF;
    
    -- Place auto bid
    INSERT INTO public.bids (auction_id, user_id, bid_amount, is_autobid)
    VALUES (NEW.auction_id, _auto_bid.user_id, _new_bid_amount, true);
    
    -- Update auction
    UPDATE public.auctions
    SET 
      current_bid = _new_bid_amount,
      highest_bidder_id = _auto_bid.user_id,
      updated_at = now()
    WHERE id = NEW.auction_id;
    
    -- Update auto bid's current proxy
    UPDATE public.auto_bids
    SET 
      current_proxy_bid = _new_bid_amount,
      updated_at = now()
    WHERE id = _auto_bid.id;
    
    -- Get bidder name
    SELECT full_name INTO _bidder_name
    FROM public.profiles
    WHERE id = _auto_bid.user_id;
    
    -- Notify listing owner
    INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
    VALUES (
      _listing_owner_id,
      'مزايدة تلقائية جديدة',
      'مزايدة تلقائية من ' || COALESCE(_bidder_name, 'مستخدم') || ' بمبلغ ' || _new_bid_amount || ' ريال على "' || _listing_title || '"',
      'new_bid',
      _auction.listing_id,
      _auto_bid.user_id
    );
    
    -- Notify the user who was just outbid
    INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
    VALUES (
      NEW.user_id,
      'تم تجاوز عرضك بمزايدة تلقائية',
      'تم تجاوز عرضك في المزاد على "' || _listing_title || '" بمزايدة تلقائية بمبلغ ' || _new_bid_amount || ' ريال',
      'bid_outbid',
      _auction.listing_id,
      _auto_bid.user_id
    );
    
    -- Award points for auto-bidding
    PERFORM add_points(_auto_bid.user_id, 2, 'مزايدة تلقائية', NEW.auction_id);
    
    -- Exit after first auto bid (only one can win at a time)
    EXIT;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto bids processing
CREATE TRIGGER on_new_bid_process_auto
  AFTER INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.process_auto_bids();

-- Add updated_at trigger for auto_bids
CREATE TRIGGER update_auto_bids_updated_at
  BEFORE UPDATE ON public.auto_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for auto_bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_bids;

-- Enable realtime for push_subscriptions  
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;