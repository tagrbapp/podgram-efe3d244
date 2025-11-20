-- Add approval status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval date column
ALTER TABLE public.profiles
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved by column
ALTER TABLE public.profiles
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Add comment for update trigger
COMMENT ON COLUMN public.profiles.approval_status IS 'User account approval status: pending, approved, or rejected';

-- Create index for faster queries
CREATE INDEX idx_profiles_approval_status ON public.profiles(approval_status);

-- Update RLS policies for listings to check approval status
DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة إعلاناتهم" ON public.listings;
CREATE POLICY "المستخدمون المعتمدون يمكنهم إضافة إعلاناتهم"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND approval_status = 'approved'
  )
);

-- Update RLS policies for auctions to check approval status
DROP POLICY IF EXISTS "Users can create their own auctions" ON public.auctions;
CREATE POLICY "المستخدمون المعتمدون يمكنهم إنشاء مزاداتهم"
ON public.auctions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND approval_status = 'approved'
  )
);

-- Function to approve user
CREATE OR REPLACE FUNCTION public.approve_user(_admin_id UUID, _user_id UUID, _approve BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(_admin_id, 'admin'::app_role) AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح');
  END IF;

  -- Get user name
  SELECT full_name INTO _user_name FROM public.profiles WHERE id = _user_id;

  -- Update approval status
  UPDATE public.profiles
  SET 
    approval_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    approved_at = now(),
    approved_by = _admin_id
  WHERE id = _user_id;

  -- Send notification to user
  IF _approve THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      _user_id,
      'تم الموافقة على حسابك ✓',
      'مرحباً بك! تم الموافقة على حسابك. يمكنك الآن إضافة إعلانات ومزادات',
      'account_approved'
    );
  ELSE
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      _user_id,
      'تم رفض طلب الموافقة',
      'نعتذر، لم تتم الموافقة على حسابك. للمزيد من المعلومات يرجى التواصل مع الإدارة',
      'account_rejected'
    );
  END IF;

  -- Log admin action
  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, reason)
  VALUES (
    _admin_id,
    CASE WHEN _approve THEN 'approve_user' ELSE 'reject_user' END,
    'user',
    _user_id,
    CASE WHEN _approve THEN 'تمت الموافقة على العضو' ELSE 'تم رفض العضو' END
  );

  RETURN json_build_object('success', true);
END;
$$;

-- Notify admins when new user signs up
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admins about new user registration
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
      'عضو جديد "' || NEW.full_name || '" بحاجة للموافقة',
      'new_user_pending',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user notifications
DROP TRIGGER IF EXISTS notify_admins_on_new_user_trigger ON public.profiles;
CREATE TRIGGER notify_admins_on_new_user_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_user();