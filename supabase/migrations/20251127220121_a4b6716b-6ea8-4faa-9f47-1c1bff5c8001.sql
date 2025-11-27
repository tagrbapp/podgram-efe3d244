-- Create membership type enum
CREATE TYPE public.membership_type AS ENUM ('merchant', 'consumer');

-- Add membership_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN membership_type membership_type NOT NULL DEFAULT 'consumer';

-- Update the approval logic: consumers don't need approval
-- Merchants start as pending, consumers are auto-approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_referred_by_code TEXT;
  v_membership_type membership_type;
  v_approval_status TEXT;
BEGIN
  -- Generate unique 8-character referral code for new user
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  
  -- Get referral code from metadata if provided
  v_referred_by_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Get membership type from metadata (default to consumer)
  v_membership_type := COALESCE((NEW.raw_user_meta_data->>'membership_type')::membership_type, 'consumer'::membership_type);
  
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
  
  -- Insert profile with referral code, referrer, membership type and approval status
  INSERT INTO public.profiles (id, full_name, referral_code, referred_by, membership_type, approval_status, approved_at, approved_by)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    v_referral_code,
    v_referrer_id,
    v_membership_type,
    v_approval_status,
    CASE WHEN v_approval_status = 'approved' THEN now() ELSE NULL END,
    CASE WHEN v_approval_status = 'approved' THEN NEW.id ELSE NULL END
  );
  
  -- Notify admins only for merchant registrations
  IF v_membership_type = 'merchant' THEN
    PERFORM notify_admins_on_new_user();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update RLS policies for listings - only approved merchants can create
DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم إضافة" ON public.listings;

CREATE POLICY "Only approved merchants can create listings"
ON public.listings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.membership_type = 'merchant' 
    AND profiles.approval_status = 'approved'
  )
);

-- Update RLS policies for auctions - only approved merchants can create
DROP POLICY IF EXISTS "المستخدمون المعتمدون يمكنهم إنشاء" ON public.auctions;

CREATE POLICY "Only approved merchants can create auctions"
ON public.auctions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.membership_type = 'merchant' 
    AND profiles.approval_status = 'approved'
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON public.profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);