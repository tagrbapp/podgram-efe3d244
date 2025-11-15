-- دالة قبول الدعوة
CREATE OR REPLACE FUNCTION public.accept_auction_invitation(_invitation_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invitation RECORD;
  _listing_title TEXT;
BEGIN
  SELECT * INTO _invitation FROM auction_invitations WHERE id = _invitation_id AND invitee_id = auth.uid();
  IF _invitation IS NULL THEN 
    RETURN json_build_object('success', false, 'error', 'الدعوة غير موجودة'); 
  END IF;
  
  IF _invitation.status != 'pending' THEN 
    RETURN json_build_object('success', false, 'error', 'تم الرد على الدعوة مسبقاً'); 
  END IF;
  
  UPDATE auction_invitations SET status = 'accepted', responded_at = now() WHERE id = _invitation_id;
  UPDATE auctions SET invited_bidders = array_append(invited_bidders, auth.uid()) 
  WHERE id = _invitation.auction_id AND NOT (auth.uid() = ANY(invited_bidders));
  
  SELECT l.title INTO _listing_title FROM auctions a JOIN listings l ON l.id = a.listing_id WHERE a.id = _invitation.auction_id;
  INSERT INTO notifications (user_id, title, message, type) 
  VALUES (_invitation.inviter_id, 'قبول دعوة مزاد', 'قبل مستخدم دعوتك للمزاد على "' || COALESCE(_listing_title, 'منتج') || '"', 'invitation_accepted');
  
  RETURN json_build_object('success', true);
END;
$$;

-- دالة رفض الدعوة
CREATE OR REPLACE FUNCTION public.decline_auction_invitation(_invitation_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE auction_invitations SET status = 'declined', responded_at = now() 
  WHERE id = _invitation_id AND invitee_id = auth.uid();
  
  IF NOT FOUND THEN 
    RETURN json_build_object('success', false, 'error', 'الدعوة غير موجودة'); 
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- دالة حساب الإحصائيات
CREATE OR REPLACE FUNCTION public.calculate_auction_stats(_user_id UUID, _days INTEGER DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result json;
  _start_date DATE := CURRENT_DATE - _days;
BEGIN
  SELECT json_build_object(
    'total_auctions', COUNT(DISTINCT a.id),
    'active_auctions', COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active'),
    'ended_auctions', COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ended'),
    'won_auctions', COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ended' AND a.highest_bidder_id IS NOT NULL),
    'total_bids', COUNT(b.id),
    'avg_bids_per_auction', COALESCE(ROUND(COUNT(b.id)::NUMERIC / NULLIF(COUNT(DISTINCT a.id), 0), 2), 0),
    'total_revenue', COALESCE(SUM(CASE WHEN a.status = 'ended' AND a.highest_bidder_id IS NOT NULL THEN a.current_bid ELSE 0 END), 0),
    'success_rate', COALESCE(ROUND((COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ended' AND a.highest_bidder_id IS NOT NULL)::NUMERIC / NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ended'), 0)) * 100, 2), 0)
  ) INTO _result
  FROM auctions a
  JOIN listings l ON l.id = a.listing_id
  LEFT JOIN bids b ON b.auction_id = a.id
  WHERE l.user_id = _user_id AND a.created_at >= _start_date;
  
  RETURN _result;
END;
$$;

-- دالة بيانات Timeline
CREATE OR REPLACE FUNCTION public.get_auction_timeline_data(_user_id UUID, _days INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, auctions_count BIGINT, bids_count BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(a.created_at) as date, 
    COUNT(DISTINCT a.id) as auctions_count, 
    COUNT(b.id) as bids_count,
    COALESCE(SUM(CASE WHEN a.status = 'ended' AND a.highest_bidder_id IS NOT NULL THEN a.current_bid ELSE 0 END), 0) as revenue
  FROM auctions a
  JOIN listings l ON l.id = a.listing_id
  LEFT JOIN bids b ON b.auction_id = a.id AND DATE(b.created_at) = DATE(a.created_at)
  WHERE l.user_id = _user_id AND a.created_at >= CURRENT_DATE - _days
  GROUP BY DATE(a.created_at)
  ORDER BY date;
END;
$$;

-- دالة فحص التنبيهات
CREATE OR REPLACE FUNCTION public.check_auction_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _alert RECORD;
  _auction RECORD;
  _listing_title TEXT;
BEGIN
  FOR _alert IN SELECT * FROM auction_alerts WHERE alert_type = 'price_reached' AND is_active = true AND is_triggered = false LOOP
    SELECT * INTO _auction FROM auctions WHERE id = _alert.auction_id;
    IF _auction.current_bid IS NOT NULL AND _auction.current_bid <= _alert.target_price AND _auction.status = 'active' THEN
      UPDATE auction_alerts SET is_triggered = true, triggered_at = now() WHERE id = _alert.id;
      SELECT l.title INTO _listing_title FROM listings l WHERE l.id = _auction.listing_id;
      INSERT INTO notifications (user_id, title, message, type, listing_id)
      VALUES (_alert.user_id, 'وصل المزاد للسعر المستهدف! 🎯', 'المزاد على "' || COALESCE(_listing_title, 'منتج') || '" وصل للسعر ' || _alert.target_price || ' ريال', 'alert_triggered', _auction.listing_id);
    END IF;
  END LOOP;
  
  FOR _alert IN SELECT * FROM auction_alerts WHERE alert_type = 'time_remaining' AND is_active = true AND is_triggered = false LOOP
    SELECT * INTO _auction FROM auctions WHERE id = _alert.auction_id;
    IF _auction.end_time <= (now() + (_alert.time_before_end || ' minutes')::INTERVAL) AND _auction.status = 'active' THEN
      UPDATE auction_alerts SET is_triggered = true, triggered_at = now() WHERE id = _alert.id;
      SELECT l.title INTO _listing_title FROM listings l WHERE l.id = _auction.listing_id;
      INSERT INTO notifications (user_id, title, message, type, listing_id)
      VALUES (_alert.user_id, 'المزاد على وشك الانتهاء! ⏰', 'سينتهي المزاد على "' || COALESCE(_listing_title, 'منتج') || '" خلال ' || _alert.time_before_end || ' دقيقة', 'alert_triggered', _auction.listing_id);
    END IF;
  END LOOP;
END;
$$;