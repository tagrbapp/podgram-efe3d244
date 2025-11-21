-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Update the handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
BEGIN
  -- Generate unique 8-character referral code
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  
  -- Insert profile with referral code
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    v_referral_code
  );
  
  RETURN NEW;
END;
$$;

-- Function to award referral points
CREATE OR REPLACE FUNCTION award_referral_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points if referred_by is set and this is a new referral
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD.referred_by IS DISTINCT FROM NEW.referred_by) THEN
    -- Add 10 points to the referrer
    PERFORM add_points(
      _user_id := NEW.referred_by,
      _points := 10,
      _reason := 'دعوة صديق',
      _reference_id := NEW.id::TEXT
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for awarding referral points
DROP TRIGGER IF EXISTS trigger_award_referral_points ON profiles;
CREATE TRIGGER trigger_award_referral_points
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_points();

-- Also award points on insert if referred_by is set
CREATE OR REPLACE FUNCTION award_referral_points_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    -- Add 10 points to the referrer
    PERFORM add_points(
      _user_id := NEW.referred_by,
      _points := 10,
      _reason := 'دعوة صديق',
      _reference_id := NEW.id::TEXT
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_referral_points_on_insert ON profiles;
CREATE TRIGGER trigger_award_referral_points_on_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_points_on_insert();