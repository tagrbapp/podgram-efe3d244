-- تعديل دالة place_bid لمنع المزايدة المتتالية من نفس المستخدم
CREATE OR REPLACE FUNCTION public.place_bid(_auction_id uuid, _user_id uuid, _bid_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _auction RECORD;
  _listing_owner_id UUID;
  _auction_owner_id UUID;
  _bidder_name TEXT;
  _listing_title TEXT;
  _auction_title TEXT;
  _last_bidder_id UUID;
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
  
  -- Check if user is not the auction owner (direct check from auctions table)
  IF _auction.user_id IS NOT NULL AND _auction.user_id = _user_id THEN
    RETURN json_build_object('success', false, 'error', 'لا يمكنك المزايدة على مزادك الخاص');
  END IF;
  
  -- Also check listing owner if listing_id exists
  IF _auction.listing_id IS NOT NULL THEN
    SELECT user_id INTO _listing_owner_id
    FROM public.listings
    WHERE id = _auction.listing_id;
    
    IF _listing_owner_id = _user_id THEN
      RETURN json_build_object('success', false, 'error', 'لا يمكنك المزايدة على إعلانك');
    END IF;
    
    -- Use listing owner for notifications
    _auction_owner_id := _listing_owner_id;
  ELSE
    -- Use auction owner for notifications
    _auction_owner_id := _auction.user_id;
  END IF;
  
  -- التحقق من آخر مزايد - منع المزايدة المتتالية من نفس المستخدم
  SELECT user_id INTO _last_bidder_id
  FROM public.bids
  WHERE auction_id = _auction_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF _last_bidder_id IS NOT NULL AND _last_bidder_id = _user_id THEN
    RETURN json_build_object('success', false, 'error', 'لا يمكنك المزايدة مرتين متتاليتين. يجب أن يزايد مستخدم آخر أولاً');
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
  
  -- Get bidder info for notification
  SELECT full_name INTO _bidder_name FROM public.profiles WHERE id = _user_id;
  
  -- Get title (from listing or auction)
  IF _auction.listing_id IS NOT NULL THEN
    SELECT title INTO _listing_title FROM public.listings WHERE id = _auction.listing_id;
    _auction_title := _listing_title;
  ELSE
    _auction_title := _auction.title;
  END IF;
  
  -- Notify auction/listing owner
  IF _auction_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
    VALUES (
      _auction_owner_id,
      'مزايدة جديدة على مزادك',
      'قدم ' || COALESCE(_bidder_name, 'مستخدم') || ' عرضاً بمبلغ ' || _bid_amount || ' ريال على "' || COALESCE(_auction_title, 'المزاد') || '"',
      'new_bid',
      _auction.listing_id,
      _user_id
    );
  END IF;
  
  -- Notify previous highest bidder if exists and different
  IF _auction.highest_bidder_id IS NOT NULL AND _auction.highest_bidder_id != _user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, listing_id, related_user_id)
    VALUES (
      _auction.highest_bidder_id,
      'تم تجاوز عرضك',
      'تم تجاوز عرضك في المزاد على "' || COALESCE(_auction_title, 'المزاد') || '" بمبلغ ' || _bid_amount || ' ريال',
      'bid_outbid',
      _auction.listing_id,
      _user_id
    );
  END IF;
  
  -- Award points for bidding
  PERFORM add_points(_user_id, 3, 'المزايدة في مزاد', _auction_id);
  
  RETURN json_build_object('success', true, 'current_bid', _bid_amount);
END;
$function$;