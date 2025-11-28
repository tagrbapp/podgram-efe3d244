-- Add merchant verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS commercial_registration TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create membership_change_history table
CREATE TABLE IF NOT EXISTS public.membership_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_type membership_type NOT NULL,
  to_type membership_type NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  business_name TEXT,
  commercial_registration TEXT,
  business_type TEXT,
  business_description TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on membership_change_history
ALTER TABLE public.membership_change_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own membership history"
  ON public.membership_change_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all history
CREATE POLICY "Admins can view all membership history"
  ON public.membership_change_history
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert history records
CREATE POLICY "System can insert membership history"
  ON public.membership_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_membership_history_user_id 
  ON public.membership_change_history(user_id);

CREATE INDEX IF NOT EXISTS idx_membership_history_created_at 
  ON public.membership_change_history(created_at DESC);

-- Add comment
COMMENT ON TABLE public.membership_change_history IS 'Tracks all membership type and status changes for audit purposes';