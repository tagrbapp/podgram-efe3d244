-- Update handle_new_user to process referral code from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_referred_by_code TEXT;
BEGIN
  -- Generate unique 8-character referral code for new user
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  
  -- Get referral code from metadata if provided
  v_referred_by_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Find referrer if code was provided
  IF v_referred_by_code IS NOT NULL AND v_referred_by_code != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = UPPER(v_referred_by_code);
  END IF;
  
  -- Insert profile with referral code and referrer
  INSERT INTO public.profiles (id, full_name, referral_code, referred_by)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    v_referral_code,
    v_referrer_id
  );
  
  RETURN NEW;
END;
$$;