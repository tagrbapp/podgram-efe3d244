-- Fix handle_new_user function - inline admin notification logic instead of calling trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_referred_by_code TEXT;
  v_membership_type membership_type;
  v_approval_status TEXT;
  v_selected_plan_id UUID;
  v_full_name TEXT;
  admin_user RECORD;
BEGIN
  -- Generate unique 8-character referral code for new user
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  
  -- Get referral code from metadata if provided
  v_referred_by_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Get membership type from metadata (default to consumer)
  v_membership_type := COALESCE((NEW.raw_user_meta_data->>'membership_type')::membership_type, 'consumer'::membership_type);
  
  -- Get selected plan id from metadata
  v_selected_plan_id := (NEW.raw_user_meta_data->>'selected_plan_id')::UUID;
  
  -- Get full name
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- Set approval status based on membership type
  IF v_membership_type = 'merchant' THEN
    v_approval_status := 'pending';
  ELSE
    v_approval_status := 'approved';
  END IF;
  
  -- Find referrer if code was provided
  IF v_referred_by_code IS NOT NULL AND v_referred_by_code != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = UPPER(v_referred_by_code);
  END IF;
  
  -- Insert profile with referral code, referrer, membership type, approval status and selected plan
  INSERT INTO public.profiles (id, full_name, referral_code, referred_by, membership_type, approval_status, approved_at, approved_by, selected_plan_id)
  VALUES (
    NEW.id, 
    v_full_name,
    v_referral_code,
    v_referrer_id,
    v_membership_type,
    v_approval_status,
    CASE WHEN v_approval_status = 'approved' THEN now() ELSE NULL END,
    CASE WHEN v_approval_status = 'approved' THEN NEW.id ELSE NULL END,
    v_selected_plan_id
  );
  
  -- Notify admins only for merchant registrations (inline logic)
  IF v_membership_type = 'merchant' THEN
    FOR admin_user IN 
      SELECT DISTINCT user_id 
      FROM public.user_roles 
      WHERE role IN ('admin', 'moderator')
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_user_id
      ) VALUES (
        admin_user.user_id,
        'عضو جديد قيد المراجعة',
        'عضو جديد "' || COALESCE(v_full_name, 'مستخدم') || '" بحاجة للموافقة',
        'new_user_pending',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;