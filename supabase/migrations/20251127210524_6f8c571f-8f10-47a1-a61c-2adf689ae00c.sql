-- Create admin function to delete/hide auction
CREATE OR REPLACE FUNCTION public.admin_delete_auction(
  _admin_id UUID,
  _auction_id UUID,
  _reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _auction_owner_id UUID;
  _auction_title TEXT;
BEGIN
  -- Check admin permissions
  IF NOT has_role(_admin_id, 'admin'::app_role) 
     AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Get auction details
  SELECT user_id, title INTO _auction_owner_id, _auction_title
  FROM auctions WHERE id = _auction_id;
  
  -- Update auction status to inactive (soft delete)
  UPDATE auctions 
  SET status = 'inactive', updated_at = now()
  WHERE id = _auction_id;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
  VALUES (_admin_id, 'delete_auction', 'auction', _auction_id, _reason);
  
  -- Notify auction owner
  IF _auction_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      _auction_owner_id,
      'تم حذف المزاد',
      'تم حذف مزادك "' || COALESCE(_auction_title, '') || '" من قبل المشرفين. السبب: ' || _reason,
      'auction_removed'
    );
  END IF;
END;
$$;