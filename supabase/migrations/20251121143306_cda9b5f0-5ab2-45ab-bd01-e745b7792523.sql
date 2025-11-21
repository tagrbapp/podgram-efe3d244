-- Create function to notify referrer when someone signs up with their code
CREATE OR REPLACE FUNCTION public.notify_referrer_on_new_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_name TEXT;
  _new_user_name TEXT;
BEGIN
  -- Only proceed if this is a new referral
  IF NEW.referred_by IS NOT NULL THEN
    -- Get referrer's name
    SELECT full_name INTO _referrer_name
    FROM public.profiles
    WHERE id = NEW.referred_by;
    
    -- Get new user's name
    _new_user_name := NEW.full_name;
    
    -- Send notification to referrer
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_user_id
    ) VALUES (
      NEW.referred_by,
      '🎉 إحالة جديدة!',
      'انضم ' || COALESCE(_new_user_name, 'عضو جديد') || ' باستخدام كود الإحالة الخاص بك وحصلت على 10 نقاط!',
      'referral_success',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify referrer after new user signs up
DROP TRIGGER IF EXISTS on_new_referral_notify_referrer ON public.profiles;
CREATE TRIGGER on_new_referral_notify_referrer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION public.notify_referrer_on_new_referral();