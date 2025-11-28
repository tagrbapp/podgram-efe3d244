-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('approval', 'rejection')),
  
  -- Template styling
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  background_color TEXT NOT NULL DEFAULT '#f9fafb',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  
  -- Template structure
  header_style TEXT NOT NULL DEFAULT 'classic',
  show_features_box BOOLEAN NOT NULL DEFAULT true,
  show_footer_logo BOOLEAN NOT NULL DEFAULT false,
  button_style TEXT NOT NULL DEFAULT 'solid',
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  preview_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage templates"
  ON public.email_templates
  FOR ALL
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

CREATE POLICY "Anyone can view active templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Add template_id to email_settings
ALTER TABLE public.email_settings 
ADD COLUMN approval_template_id UUID REFERENCES public.email_templates(id),
ADD COLUMN rejection_template_id UUID REFERENCES public.email_templates(id);

-- Insert default templates
INSERT INTO public.email_templates (name, description, template_type, primary_color, is_default, header_style) VALUES
('كلاسيكي - موافقة', 'قالب كلاسيكي بسيط ومهني للموافقات', 'approval', '#2563eb', true, 'classic'),
('عصري - موافقة', 'قالب عصري بألوان جريئة وتصميم حديث', 'approval', '#10b981', false, 'modern'),
('فاخر - موافقة', 'قالب فاخر بتدرجات لونية وظلال', 'approval', '#8b5cf6', false, 'luxury'),
('كلاسيكي - رفض', 'قالب كلاسيكي بسيط للرفض', 'rejection', '#dc2626', true, 'classic'),
('مهني - رفض', 'قالب مهني يركز على الدعم والمساعدة', 'rejection', '#f59e0b', false, 'professional');

-- Update trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();