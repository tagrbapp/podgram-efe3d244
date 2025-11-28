-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  category TEXT NOT NULL, -- 'auction', 'user', 'admin', 'system'
  variables JSONB DEFAULT '[]'::jsonb, -- متغيرات القالب المتاحة
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
ON public.notification_templates
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO public.notification_templates (template_key, name, description, title_template, message_template, type, category, variables) VALUES
('new_user_pending', 'عضو جديد قيد المراجعة', 'إشعار المسؤولين عند تسجيل عضو تاجر جديد', 'عضو جديد قيد المراجعة', 'عضو جديد "{{user_name}}" بحاجة للموافقة', 'system', 'admin', '["user_name"]'::jsonb),
('account_approved', 'الموافقة على الحساب', 'إشعار المستخدم عند الموافقة على حسابه', 'تم الموافقة على حسابك ✓', 'مرحباً بك! تم الموافقة على حسابك. يمكنك الآن إضافة إعلانات ومزادات', 'system', 'user', '[]'::jsonb),
('account_rejected', 'رفض الحساب', 'إشعار المستخدم عند رفض حسابه', 'تم رفض طلب الموافقة', 'نعتذر، لم تتم الموافقة على حسابك. للمزيد من المعلومات يرجى التواصل مع الإدارة', 'system', 'user', '[]'::jsonb),
('new_bid', 'مزايدة جديدة', 'إشعار صاحب المزاد عند مزايدة جديدة', 'مزايدة جديدة على مزادك', 'قدم {{bidder_name}} عرضاً بمبلغ {{bid_amount}} ريال على "{{listing_title}}"', 'bid', 'auction', '["bidder_name", "bid_amount", "listing_title"]'::jsonb),
('bid_outbid', 'تم تجاوز عرضك', 'إشعار المزايد عند تجاوز عرضه', 'تم تجاوز عرضك', 'تم تجاوز عرضك في المزاد على "{{listing_title}}" بمبلغ {{bid_amount}} ريال', 'outbid', 'auction', '["listing_title", "bid_amount"]'::jsonb),
('auction_extended', 'تمديد المزاد', 'إشعار عند تمديد المزاد', '⏰ تمديد المزاد', 'تم تمديد المزاد على "{{listing_title}}" لمدة 15 دقيقة إضافية! لا تفوت الفرصة', 'auction_extended', 'auction', '["listing_title"]'::jsonb),
('auction_won', 'الفوز بالمزاد', 'إشعار الفائز بالمزاد', 'فزت بالمزاد! 🎉', 'تهانينا! فزت بمزاد "{{listing_title}}" بمبلغ {{final_price}} ريال', 'auction_won', 'auction', '["listing_title", "final_price"]'::jsonb),
('auction_ended', 'انتهاء المزاد', 'إشعار صاحب المزاد عند انتهائه', 'انتهى المزاد', 'انتهى المزاد على "{{listing_title}}". الفائز: {{winner_name}} بمبلغ {{final_price}} ريال', 'auction_end', 'auction', '["listing_title", "winner_name", "final_price"]'::jsonb),
('favorite_added', 'إضافة للمفضلة', 'إشعار صاحب الإعلان عند إضافته للمفضلة', 'تم إضافة إعلانك للمفضلة', 'قام {{user_name}} بإضافة إعلانك "{{listing_title}}" إلى المفضلة', 'favorite', 'user', '["user_name", "listing_title"]'::jsonb),
('new_message', 'رسالة جديدة', 'إشعار عند استلام رسالة جديدة', 'رسالة جديدة', 'رسالة جديدة من {{sender_name}} بخصوص "{{listing_title}}"', 'message', 'user', '["sender_name", "listing_title"]'::jsonb),
('new_review', 'تقييم جديد', 'إشعار البائع عند تلقي تقييم', 'تقييم جديد', 'قام {{reviewer_name}} بتقييمك بـ {{rating}} نجوم', 'review', 'user', '["reviewer_name", "rating"]'::jsonb),
('review_reply', 'رد على التقييم', 'إشعار المقيم عند رد البائع', 'رد على تقييمك', 'رد {{seller_name}} على تقييمك', 'review', 'user', '["seller_name"]'::jsonb),
('new_report', 'بلاغ جديد', 'إشعار المسؤولين عند بلاغ جديد', 'بلاغ جديد', 'تم استلام بلاغ جديد من {{reporter_name}} - السبب: {{reason}}', 'system', 'admin', '["reporter_name", "reason"]'::jsonb),
('referral_success', 'إحالة جديدة', 'إشعار المحيل عند انضمام عضو جديد', '🎉 إحالة جديدة!', 'انضم {{new_user_name}} باستخدام كود الإحالة الخاص بك وحصلت على 10 نقاط!', 'system', 'user', '["new_user_name"]'::jsonb),
('level_up', 'مستوى جديد', 'إشعار عند الوصول لمستوى جديد', 'مستوى جديد! 🎉', 'تهانينا! لقد وصلت إلى المستوى {{level}}', 'system', 'user', '["level"]'::jsonb),
('achievement_earned', 'إنجاز جديد', 'إشعار عند تحقيق إنجاز', 'إنجاز جديد! 🎉', 'تهانينا! لقد حققت إنجاز "{{achievement_name}}" وحصلت على {{points}} نقطة', 'system', 'user', '["achievement_name", "points"]'::jsonb),
('badge_earned', 'شارة جديدة', 'إشعار عند الحصول على شارة', 'شارة جديدة! 🏆', 'تهانينا! لقد حصلت على شارة "{{badge_name}}"', 'system', 'user', '["badge_name"]'::jsonb),
('account_blocked', 'حظر الحساب', 'إشعار المستخدم عند حظر حسابه', 'تم حظر حسابك', 'تم حظر حسابك من قبل المشرفين. السبب: {{reason}}', 'system', 'user', '["reason"]'::jsonb),
('listing_removed', 'حذف الإعلان', 'إشعار صاحب الإعلان عند حذفه', 'تم حذف إعلانك', 'تم حذف إعلانك "{{listing_title}}" من قبل المشرفين. السبب: {{reason}}', 'system', 'user', '["listing_title", "reason"]'::jsonb),
('auction_removed', 'حذف المزاد', 'إشعار صاحب المزاد عند حذفه', 'تم حذف المزاد', 'تم حذف مزادك "{{auction_title}}" من قبل المشرفين. السبب: {{reason}}', 'system', 'user', '["auction_title", "reason"]'::jsonb);

-- Create function to get template and replace variables
CREATE OR REPLACE FUNCTION get_notification_from_template(
  _template_key TEXT,
  _variables JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (title TEXT, message TEXT, type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _template RECORD;
  _final_title TEXT;
  _final_message TEXT;
  _var_key TEXT;
  _var_value TEXT;
BEGIN
  -- Get template
  SELECT * INTO _template
  FROM notification_templates
  WHERE template_key = _template_key AND is_active = true;
  
  IF _template IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', _template_key;
  END IF;
  
  _final_title := _template.title_template;
  _final_message := _template.message_template;
  
  -- Replace variables
  FOR _var_key, _var_value IN SELECT * FROM jsonb_each_text(_variables)
  LOOP
    _final_title := REPLACE(_final_title, '{{' || _var_key || '}}', COALESCE(_var_value, ''));
    _final_message := REPLACE(_final_message, '{{' || _var_key || '}}', COALESCE(_var_value, ''));
  END LOOP;
  
  RETURN QUERY SELECT _final_title, _final_message, _template.type;
END;
$$;