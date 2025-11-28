-- Create email_settings table
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Approval email settings
  approval_subject TEXT NOT NULL DEFAULT 'تم الموافقة على طلب الترقية! ✓',
  approval_title TEXT NOT NULL DEFAULT 'مرحباً بك! 🎉',
  approval_message TEXT NOT NULL DEFAULT 'يسعدنا إبلاغك بأنه تمت الموافقة على طلب ترقية عضويتك إلى حساب تاجر.',
  approval_button_text TEXT NOT NULL DEFAULT 'زيارة المنصة',
  
  -- Rejection email settings
  rejection_subject TEXT NOT NULL DEFAULT 'بخصوص طلب الترقية',
  rejection_title TEXT NOT NULL DEFAULT 'مرحباً',
  rejection_message TEXT NOT NULL DEFAULT 'نعتذر عن إبلاغك بأنه لم تتم الموافقة على طلب ترقية عضويتك إلى حساب تاجر حالياً.',
  rejection_footer TEXT NOT NULL DEFAULT 'يمكنك التواصل معنا للحصول على مزيد من المعلومات أو إعادة تقديم الطلب لاحقاً.',
  
  -- General settings
  sender_name TEXT NOT NULL DEFAULT 'Podgram',
  sender_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
  footer_text TEXT NOT NULL DEFAULT 'شكراً لاختيارك Podgram',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Policies - only admins can read/write
CREATE POLICY "Admins can view email settings"
  ON public.email_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update email settings"
  ON public.email_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can insert email settings"
  ON public.email_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Insert default settings
INSERT INTO public.email_settings (id) VALUES (gen_random_uuid());

-- Create trigger to update updated_at
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();