-- Create auth_settings table for managing registration form content
CREATE TABLE IF NOT EXISTS public.auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_title text NOT NULL DEFAULT 'تاجر',
  merchant_description text NOT NULL DEFAULT 'يمكنك طرح المنتجات والمزادات بعد موافقة الإدارة',
  consumer_title text NOT NULL DEFAULT 'مستهلك',
  consumer_description text NOT NULL DEFAULT 'يمكنك المزايدة على المنتجات فوراً دون الحاجة لموافقة الإدارة',
  membership_section_title text NOT NULL DEFAULT 'نوع العضوية',
  full_name_label text NOT NULL DEFAULT 'الاسم الكامل',
  full_name_placeholder text NOT NULL DEFAULT 'أحمد محمد',
  full_name_hint text NOT NULL DEFAULT 'يجب إدخال اسمين عربيين على الأقل (بدون أرقام أو رموز)',
  email_label text NOT NULL DEFAULT 'البريد الإلكتروني',
  password_label text NOT NULL DEFAULT 'كلمة المرور',
  password_hint text NOT NULL DEFAULT 'استخدم 8+ أحرف مع مزيج من الأحرف الكبيرة والصغيرة، أرقام ورموز',
  confirm_password_label text NOT NULL DEFAULT 'تأكيد كلمة المرور',
  referral_code_label text NOT NULL DEFAULT 'كود الإحالة (اختياري)',
  register_button_text text NOT NULL DEFAULT 'إنشاء حساب',
  login_tab_text text NOT NULL DEFAULT 'تسجيل الدخول',
  register_tab_text text NOT NULL DEFAULT 'حساب جديد',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active settings
CREATE POLICY "Anyone can view active auth settings"
ON public.auth_settings
FOR SELECT
USING (is_active = true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage auth settings"
ON public.auth_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_auth_settings_updated_at
BEFORE UPDATE ON public.auth_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.auth_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_auth_settings_is_active ON public.auth_settings(is_active);