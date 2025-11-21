-- Fix security warnings for referral functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;