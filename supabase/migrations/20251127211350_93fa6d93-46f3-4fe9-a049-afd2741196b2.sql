-- تعديل دالة حذف المزاد لاستخدام status مسموح
CREATE OR REPLACE FUNCTION public.admin_delete_auction(_admin_id uuid, _auction_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _auction_owner_id UUID;
  _auction_title TEXT;
BEGIN
  -- التحقق من صلاحيات المشرف
  IF NOT has_role(_admin_id, 'admin'::app_role) 
     AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- الحصول على معلومات المزاد
  SELECT user_id, title INTO _auction_owner_id, _auction_title
  FROM auctions WHERE id = _auction_id;
  
  -- تحديث حالة المزاد إلى ended (إنهاء المزاد)
  UPDATE auctions 
  SET status = 'ended', updated_at = now()
  WHERE id = _auction_id;
  
  -- تسجيل الإجراء
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
  VALUES (_admin_id, 'delete_auction', 'auction', _auction_id, _reason);
  
  -- إشعار صاحب المزاد
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
$function$;