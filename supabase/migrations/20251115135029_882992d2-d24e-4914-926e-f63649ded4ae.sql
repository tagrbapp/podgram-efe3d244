-- Create auctions table
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  starting_price NUMERIC NOT NULL,
  current_bid NUMERIC,
  highest_bidder_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  bid_increment NUMERIC NOT NULL DEFAULT 100,
  reserve_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  bid_amount NUMERIC NOT NULL,
  is_autobid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_listing_id ON public.auctions(listing_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON public.bids(user_id);

-- Enable RLS
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Anyone can view active auctions"
  ON public.auctions FOR SELECT
  USING (status = 'active' OR status = 'ended');

CREATE POLICY "Listing owners can create auctions"
  ON public.auctions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners can update their auctions"
  ON public.auctions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for bids
CREATE POLICY "Anyone can view bids"
  ON public.bids FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can place bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to place a bid
CREATE OR REPLACE FUNCTION public.place_bid(
  _auction_id UUID,
  _user_id UUID,
  _bid_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auction RECORD;
  _listing_owner_id UUID;
  _bidder_name TEXT;
  _listing_title TEXT;
  _result JSON;
BEGIN
  -- Get auction details
  SELECT * INTO _auction
  FROM public.auctions
  WHERE id = _auction_id
  FOR UPDATE;
  
  -- Validate auction exists and is active
  IF _auction IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'المزاد غير موجود');
  END IF;
  
  IF _auction.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'المزاد غير نشط');
  END IF;
  
  IF _auction.end_time < now() THEN
    RETURN json_build_object('success', false, 'error', 'انتهى وقت المزاد');
  END IF;
  
  -- Check if user is not the listing owner
  SELECT user_id INTO _listing_owner_id
  FROM public.listings
  WHERE id = _auction.listing_id;
  
  IF _listing_owner_id = _user_id THEN
    RETURN json_build_object('success', false, 'error', 'لا يمكنك المزايدة على إعلانك');
  END IF;
  
  -- Validate bid amount
  IF _auction.current_bid IS NULL THEN
    IF _bid_amount < _auction.starting_price THEN
      RETURN json_build_object('success', false, 'error', 'المبلغ أقل من السعر الابتدائي');
    END IF;
  ELSE
    IF _bid_amount < _auction.current_bid + _auction.bid_increment THEN
      RETURN json_build_object('success', false, 'error', 'المبلغ أقل من الحد الأدنى للزيادة');
    END IF;
  END IF;
  
  -- Insert the bid
  INSERT INTO public.bids (auction_id, user_id, bid_amount)
  VALUES (_auction_id, _user_id, _bid_amount);
  
  -- Update auction
  UPDATE public.auctions
  SET 
    current_bid = _bid_amount,
    highest_bidder_id = _user_id,
    updated_at = now()
  WHERE id = _auction_id;
  
  -- Get bidder and listing info for notification
  SELECT full_name INTO _bidder_name FROM public.profiles WHERE id = _user_id;
  SELECT title INTO _listing_title FROM public.listings WHERE id = _auction.listing_id;
  
  -- Notify listing owner
  INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
  VALUES (
    _listing_owner_id,
    'مزايدة جديدة على مزادك',
    'قدم ' || COALESCE(_bidder_name, 'مستخدم') || ' عرضاً بمبلغ ' || _bid_amount || ' ريال على "' || _listing_title || '"',
    'new_bid',
    _auction.listing_id,
    _user_id
  );
  
  -- Notify previous highest bidder if exists and different
  IF _auction.highest_bidder_id IS NOT NULL AND _auction.highest_bidder_id != _user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
    VALUES (
      _auction.highest_bidder_id,
      'تم تجاوز عرضك',
      'تم تجاوز عرضك في المزاد على "' || _listing_title || '" بمبلغ ' || _bid_amount || ' ريال',
      'bid_outbid',
      _auction.listing_id,
      _user_id
    );
  END IF;
  
  -- Award points for bidding
  PERFORM add_points(_user_id, 3, 'المزايدة في مزاد', _auction_id);
  
  RETURN json_build_object('success', true, 'current_bid', _bid_amount);
END;
$$;

-- Function to end auctions automatically
CREATE OR REPLACE FUNCTION public.end_expired_auctions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auction RECORD;
  _listing_owner_id UUID;
  _winner_name TEXT;
  _listing_title TEXT;
BEGIN
  FOR _auction IN 
    SELECT * FROM public.auctions 
    WHERE status = 'active' AND end_time < now()
  LOOP
    -- Update auction status
    UPDATE public.auctions 
    SET status = 'ended', updated_at = now()
    WHERE id = _auction.id;
    
    -- If there's a winner
    IF _auction.highest_bidder_id IS NOT NULL THEN
      -- Get listing owner
      SELECT user_id INTO _listing_owner_id
      FROM public.listings
      WHERE id = _auction.listing_id;
      
      -- Get winner and listing info
      SELECT full_name INTO _winner_name 
      FROM public.profiles 
      WHERE id = _auction.highest_bidder_id;
      
      SELECT title INTO _listing_title 
      FROM public.listings 
      WHERE id = _auction.listing_id;
      
      -- Notify winner
      INSERT INTO public.notifications (user_id, title, message, type, listing_id)
      VALUES (
        _auction.highest_bidder_id,
        'فزت بالمزاد! 🎉',
        'تهانينا! فزت بمزاد "' || _listing_title || '" بمبلغ ' || _auction.current_bid || ' ريال',
        'auction_won',
        _auction.listing_id
      );
      
      -- Notify owner
      INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
      VALUES (
        _listing_owner_id,
        'انتهى المزاد',
        'انتهى المزاد على "' || _listing_title || '". الفائز: ' || COALESCE(_winner_name, 'مستخدم') || ' بمبلغ ' || _auction.current_bid || ' ريال',
        'auction_ended',
        _auction.listing_id,
        _auction.highest_bidder_id
      );
      
      -- Award points to winner and seller
      PERFORM add_points(_auction.highest_bidder_id, 15, 'الفوز بمزاد', _auction.id);
      PERFORM add_points(_listing_owner_id, 25, 'إتمام مزاد', _auction.id);
    END IF;
  END LOOP;
END;
$$;

-- Trigger for updating updated_at
CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for auctions and bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;