-- 1. إضافة حالة 'sold' لجدول listings
ALTER TABLE public.listings 
DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE public.listings 
ADD CONSTRAINT listings_status_check 
CHECK (status IN ('active', 'inactive', 'sold'));

-- 2. إضافة أعمدة الرد على التقييمات
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS seller_reply TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- 3. إنشاء نظام الأدوار
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء دالة فحص الصلاحيات (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. دالة حساب معدل الاستجابة
CREATE OR REPLACE FUNCTION public.calculate_response_rate(seller_uuid UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT c.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(DISTINCT CASE WHEN m.sender_id = seller_uuid THEN c.id END)::NUMERIC / 
         COUNT(DISTINCT c.id)::NUMERIC) * 100, 
        1
      )
    END
  FROM public.conversations c
  LEFT JOIN public.messages m ON m.conversation_id = c.id
  WHERE c.seller_id = seller_uuid
$$;

-- 6. دالة حساب وقت الرد المتوسط (بالدقائق)
CREATE OR REPLACE FUNCTION public.calculate_avg_response_time(seller_uuid UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COALESCE(
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (
            first_seller_reply.created_at - first_buyer_message.created_at
          )) / 60
        )::NUMERIC,
        1
      ),
      0
    )
  FROM public.conversations c
  CROSS JOIN LATERAL (
    SELECT created_at 
    FROM public.messages 
    WHERE conversation_id = c.id AND sender_id = c.buyer_id
    ORDER BY created_at ASC 
    LIMIT 1
  ) AS first_buyer_message
  CROSS JOIN LATERAL (
    SELECT created_at 
    FROM public.messages 
    WHERE conversation_id = c.id AND sender_id = c.seller_id AND created_at > first_buyer_message.created_at
    ORDER BY created_at ASC 
    LIMIT 1
  ) AS first_seller_reply
  WHERE c.seller_id = seller_uuid
$$;

-- 7. دالة حساب نسبة إتمام الصفقات
CREATE OR REPLACE FUNCTION public.calculate_completion_rate(seller_uuid UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'sold')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        1
      )
    END
  FROM public.listings
  WHERE user_id = seller_uuid
$$;

-- 8. دالة حساب عدد المبيعات
CREATE OR REPLACE FUNCTION public.get_total_sales(seller_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.listings
  WHERE user_id = seller_uuid AND status = 'sold'
$$;

-- 9. Trigger للإشعار عند تقييم جديد
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  -- الحصول على اسم المقيّم
  SELECT full_name INTO reviewer_name
  FROM public.profiles
  WHERE id = NEW.reviewer_id;
  
  -- إرسال إشعار للبائع
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    listing_id,
    related_user_id
  ) VALUES (
    NEW.seller_id,
    'تقييم جديد',
    'قام ' || COALESCE(reviewer_name, 'مستخدم') || ' بتقييمك بـ ' || NEW.rating || ' نجوم',
    'new_review',
    NEW.listing_id,
    NEW.reviewer_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_review();

-- 10. Trigger للإشعار عند الرد على تقييم
CREATE OR REPLACE FUNCTION public.notify_on_review_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_name TEXT;
BEGIN
  -- التحقق من أن الرد جديد (لم يكن موجودًا من قبل)
  IF NEW.seller_reply IS NOT NULL AND OLD.seller_reply IS NULL THEN
    -- الحصول على اسم البائع
    SELECT full_name INTO seller_name
    FROM public.profiles
    WHERE id = NEW.seller_id;
    
    -- إرسال إشعار للمقيّم
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      listing_id,
      related_user_id
    ) VALUES (
      NEW.reviewer_id,
      'رد على تقييمك',
      'رد ' || COALESCE(seller_name, 'البائع') || ' على تقييمك',
      'review_reply',
      NEW.listing_id,
      NEW.seller_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_reply_created
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_review_reply();

-- 11. Trigger للإشعار عند بلاغ جديد
CREATE OR REPLACE FUNCTION public.notify_admins_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  reporter_name TEXT;
BEGIN
  -- الحصول على اسم المبلّغ
  SELECT full_name INTO reporter_name
  FROM public.profiles
  WHERE id = NEW.reporter_id;
  
  -- إرسال إشعار لجميع المشرفين والأدمن
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
      listing_id,
      related_user_id
    ) VALUES (
      admin_user.user_id,
      'بلاغ جديد',
      'تم استلام بلاغ جديد من ' || COALESCE(reporter_name, 'مستخدم') || ' - السبب: ' || NEW.reason,
      'new_report',
      NEW.listing_id,
      NEW.reporter_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_report();

-- 12. تحديث RLS policies لجدول reports
CREATE POLICY "Admins can view all reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 13. RLS policies لجدول user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON public.listings(user_id, status);

-- 15. تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;