-- Fix add_points function to handle reference_id correctly
CREATE OR REPLACE FUNCTION public.add_points(
  _user_id UUID,
  _points INTEGER,
  _reason TEXT,
  _reference_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_points INTEGER;
  new_level INTEGER;
  old_level INTEGER;
  reference_uuid UUID;
BEGIN
  -- Convert reference_id to UUID if it's a valid UUID string
  IF _reference_id IS NOT NULL AND _reference_id != '' THEN
    BEGIN
      reference_uuid := _reference_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      reference_uuid := NULL;
    END;
  END IF;

  -- إضافة النقاط للمجموع
  INSERT INTO user_points (user_id, total_points, level)
  VALUES (_user_id, _points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + _points,
    updated_at = now()
  RETURNING total_points, level INTO current_points, old_level;
  
  -- حساب المستوى الجديد (كل 100 نقطة = مستوى)
  new_level := FLOOR(current_points / 100) + 1;
  
  -- تحديث المستوى إذا تغير
  IF new_level > old_level THEN
    UPDATE user_points 
    SET level = new_level
    WHERE user_id = _user_id;
    
    -- إشعار بالمستوى الجديد
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      _user_id,
      'مستوى جديد! 🎉',
      'تهانينا! لقد وصلت إلى المستوى ' || new_level,
      'level_up'
    );
  END IF;
  
  -- تسجيل في السجل
  INSERT INTO points_history (user_id, points, reason, reference_id)
  VALUES (_user_id, _points, _reason, reference_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;