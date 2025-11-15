-- ============================================================================
-- الميزة الأولى: التحليلات المتقدمة للبائعين
-- ============================================================================

-- جدول تتبع المبيعات اليومية
CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_sales_user_date ON daily_sales(user_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_listing ON daily_sales(listing_id);

-- جدول تتبع المشاهدات اليومية
CREATE TABLE IF NOT EXISTS daily_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(listing_id, view_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_views_user_date ON daily_views(user_id, view_date);
CREATE INDEX IF NOT EXISTS idx_daily_views_listing ON daily_views(listing_id);

-- Trigger لتسجيل المبيعات تلقائياً
CREATE OR REPLACE FUNCTION record_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    INSERT INTO daily_sales (user_id, listing_id, price, sale_date)
    VALUES (NEW.user_id, NEW.id, NEW.price, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_listing_sold ON listings;
CREATE TRIGGER on_listing_sold
  AFTER INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION record_sale();

-- دالة لحساب الإيرادات حسب الفترة
CREATE OR REPLACE FUNCTION get_revenue_by_period(
  seller_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(date DATE, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sale_date as date,
    SUM(price) as revenue
  FROM daily_sales
  WHERE user_id = seller_uuid
    AND sale_date BETWEEN start_date AND end_date
  GROUP BY sale_date
  ORDER BY sale_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- دالة لحساب المشاهدات حسب الفترة
CREATE OR REPLACE FUNCTION get_views_by_period(
  seller_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(date DATE, total_views BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    view_date as date,
    SUM(views_count) as total_views
  FROM daily_views
  WHERE user_id = seller_uuid
    AND view_date BETWEEN start_date AND end_date
  GROUP BY view_date
  ORDER BY view_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies للجداول الجديدة
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
  ON daily_sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own views stats"
  ON daily_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert views"
  ON daily_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update views"
  ON daily_views FOR UPDATE
  USING (true);

-- ============================================================================
-- الميزة الثانية: نظام النقاط والشارات
-- ============================================================================

-- جدول نقاط المستخدمين
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level);

-- جدول الشارات المتاحة
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL,
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول شارات المستخدمين
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- جدول سجل النقاط
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_date ON points_history(created_at);

-- دالة لإضافة نقاط
CREATE OR REPLACE FUNCTION add_points(
  _user_id UUID,
  _points INTEGER,
  _reason TEXT,
  _reference_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_points INTEGER;
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- إضافة النقاط للمجموع
  INSERT INTO user_points (user_id, total_points, level)
  VALUES (_user_id, _points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + _points,
    updated_at = now()
  RETURNING total_points, level INTO current_points, old_level;
  
  -- حساب المستوى الجديد (كل 100 نقطة = مستوى)
  new_level := FLOOR(current_points / 100) + 1;
  
  -- تحديث المستوى إذا تغير
  IF new_level > old_level THEN
    UPDATE user_points 
    SET level = new_level
    WHERE user_id = _user_id;
    
    -- إشعار بالمستوى الجديد
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      _user_id,
      'مستوى جديد! 🎉',
      'تهانينا! لقد وصلت إلى المستوى ' || new_level,
      'level_up'
    );
  END IF;
  
  -- تسجيل في السجل
  INSERT INTO points_history (user_id, points, reason, reference_id)
  VALUES (_user_id, _points, _reason, _reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لفحص وإضافة الشارات
CREATE OR REPLACE FUNCTION check_and_award_badges(_user_id UUID)
RETURNS void AS $$
DECLARE
  badge_record RECORD;
  user_sales_count INTEGER;
  user_total_revenue NUMERIC;
  user_reviews_count INTEGER;
  user_avg_rating NUMERIC;
  user_listings_count INTEGER;
BEGIN
  -- حساب إحصائيات المستخدم
  SELECT COUNT(*) INTO user_sales_count
  FROM listings WHERE user_id = _user_id AND status = 'sold';
  
  SELECT COALESCE(SUM(price), 0) INTO user_total_revenue
  FROM daily_sales WHERE user_id = _user_id;
  
  SELECT COUNT(*), COALESCE(AVG(rating), 0) 
  INTO user_reviews_count, user_avg_rating
  FROM reviews WHERE seller_id = _user_id;
  
  SELECT COUNT(*) INTO user_listings_count
  FROM listings WHERE user_id = _user_id;
  
  -- فحص كل شارة
  FOR badge_record IN SELECT * FROM badges LOOP
    -- فحص إذا استوفى الشروط ولم يحصل عليها بعد
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = _user_id AND badge_id = badge_record.id
    ) THEN
      -- فحص حسب نوع المتطلب
      IF (badge_record.requirement_type = 'sales_count' 
          AND user_sales_count >= badge_record.requirement_value)
      OR (badge_record.requirement_type = 'total_revenue' 
          AND user_total_revenue >= badge_record.requirement_value)
      OR (badge_record.requirement_type = 'reviews_count' 
          AND user_reviews_count >= badge_record.requirement_value)
      OR (badge_record.requirement_type = 'rating_avg' 
          AND user_avg_rating >= badge_record.requirement_value)
      OR (badge_record.requirement_type = 'listings_count'
          AND user_listings_count >= badge_record.requirement_value) THEN
        -- منح الشارة
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (_user_id, badge_record.id);
        
        -- إرسال إشعار
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          _user_id,
          'شارة جديدة! 🏆',
          'تهانينا! لقد حصلت على شارة "' || badge_record.name || '"',
          'badge_earned'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers لإضافة النقاط تلقائياً
CREATE OR REPLACE FUNCTION award_points_new_listing()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_points(NEW.user_id, 5, 'إضافة إعلان جديد', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_listing_points ON listings;
CREATE TRIGGER on_new_listing_points
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_new_listing();

CREATE OR REPLACE FUNCTION award_points_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    PERFORM add_points(NEW.user_id, 20, 'إتمام بيع', NEW.id);
    PERFORM check_and_award_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_sale_points ON listings;
CREATE TRIGGER on_sale_points
  AFTER INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_sale();

CREATE OR REPLACE FUNCTION award_points_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating >= 5 THEN
    PERFORM add_points(NEW.seller_id, 10, 'تقييم 5 نجوم', NEW.id);
  ELSIF NEW.rating >= 4 THEN
    PERFORM add_points(NEW.seller_id, 5, 'تقييم جيد', NEW.id);
  END IF;
  PERFORM check_and_award_badges(NEW.seller_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_review_points ON reviews;
CREATE TRIGGER on_review_points
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_points_review();

CREATE OR REPLACE FUNCTION award_points_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_points(NEW.sender_id, 2, 'إرسال رسالة', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_message_points ON messages;
CREATE TRIGGER on_message_points
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION award_points_message();

-- بيانات أولية للشارات
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, color) 
VALUES
  ('بائع مبتدئ', 'أتممت أول عملية بيع', 'Award', 'sales', 'sales_count', 1, 'blue'),
  ('بائع متمرس', 'أتممت 5 عمليات بيع', 'Trophy', 'sales', 'sales_count', 5, 'green'),
  ('بائع محترف', 'أتممت 20 عملية بيع', 'Crown', 'sales', 'sales_count', 20, 'gold'),
  ('بائع نجم', 'أتممت 50 عملية بيع', 'Star', 'sales', 'sales_count', 50, 'purple'),
  ('بائع أسطوري', 'أتممت 100 عملية بيع', 'Sparkles', 'sales', 'sales_count', 100, 'red'),
  ('محبوب', 'حصلت على 10 تقييمات إيجابية', 'Heart', 'reviews', 'reviews_count', 10, 'pink'),
  ('موثوق', 'متوسط تقييمك 4.5 أو أكثر', 'ShieldCheck', 'reviews', 'rating_avg', 4.5, 'blue'),
  ('نشط', 'أضفت 20 إعلان', 'Zap', 'activity', 'listings_count', 20, 'yellow')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view points" ON user_points FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);

CREATE POLICY "Users can view their points history" 
  ON points_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage badges" 
  ON badges FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- الميزة الثالثة: صفحة الإدارة الشاملة
-- ============================================================================

-- جدول سجل أعمال المشرفين
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_date ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);

-- تحسين جدول blocked_users
ALTER TABLE blocked_users 
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by UUID,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_blocked_users_expires ON blocked_users(expires_at);

-- دالة لحظر مستخدم
CREATE OR REPLACE FUNCTION admin_block_user(
  _admin_id UUID,
  _user_id UUID,
  _reason TEXT,
  _duration_days INTEGER DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  _expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- التحقق من صلاحيات المشرف
  IF NOT has_role(_admin_id, 'admin'::app_role) 
     AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- حساب تاريخ انتهاء الحظر
  IF _duration_days IS NOT NULL THEN
    _expires_at := now() + (_duration_days || ' days')::INTERVAL;
  END IF;
  
  -- إضافة الحظر
  INSERT INTO blocked_users (blocker_id, blocked_id, reason, blocked_by, expires_at)
  VALUES (_admin_id, _user_id, _reason, _admin_id, _expires_at)
  ON CONFLICT DO NOTHING;
  
  -- تسجيل الإجراء
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
  VALUES (_admin_id, 'block_user', 'user', _user_id, _reason);
  
  -- إرسال إشعار للمستخدم المحظور
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    _user_id,
    'تم حظر حسابك',
    'تم حظر حسابك من قبل المشرفين. السبب: ' || _reason,
    'account_blocked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لإلغاء حظر مستخدم
CREATE OR REPLACE FUNCTION admin_unblock_user(
  _admin_id UUID,
  _user_id UUID
)
RETURNS void AS $$
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) 
     AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  DELETE FROM blocked_users 
  WHERE blocked_id = _user_id;
  
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id)
  VALUES (_admin_id, 'unblock_user', 'user', _user_id);
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    _user_id,
    'تم إلغاء حظر حسابك',
    'تم إلغاء حظر حسابك. يمكنك الآن استخدام المنصة بشكل طبيعي',
    'system'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لحذف إعلان من قبل المشرف
CREATE OR REPLACE FUNCTION admin_delete_listing(
  _admin_id UUID,
  _listing_id UUID,
  _reason TEXT
)
RETURNS void AS $$
DECLARE
  _listing_user_id UUID;
  _listing_title TEXT;
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) 
     AND NOT has_role(_admin_id, 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- الحصول على معلومات الإعلان
  SELECT user_id, title INTO _listing_user_id, _listing_title
  FROM listings WHERE id = _listing_id;
  
  -- حذف الإعلان (soft delete)
  UPDATE listings 
  SET status = 'inactive'
  WHERE id = _listing_id;
  
  -- تسجيل الإجراء
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
  VALUES (_admin_id, 'delete_listing', 'listing', _listing_id, _reason);
  
  -- إشعار صاحب الإعلان
  IF _listing_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      _listing_user_id,
      'تم حذف إعلانك',
      'تم حذف إعلانك "' || COALESCE(_listing_title, '') || '" من قبل المشرفين. السبب: ' || _reason,
      'listing_removed'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لعرض المستخدمين مع إحصائياتهم (بدلاً من View)
CREATE OR REPLACE FUNCTION get_admin_users_overview()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  total_listings BIGINT,
  total_sales BIGINT,
  total_reviews BIGINT,
  avg_rating NUMERIC,
  points INTEGER,
  level INTEGER,
  is_blocked BOOLEAN,
  reports_count BIGINT
) AS $$
BEGIN
  -- التحقق من الصلاحيات
  IF NOT has_role(auth.uid(), 'admin'::app_role) 
     AND NOT has_role(auth.uid(), 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.phone,
    p.created_at,
    COUNT(DISTINCT l.id) as total_listings,
    COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END) as total_sales,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COALESCE(up.total_points, 0)::INTEGER as points,
    COALESCE(up.level, 1)::INTEGER as level,
    EXISTS(SELECT 1 FROM blocked_users WHERE blocked_id = p.id) as is_blocked,
    COUNT(DISTINCT rep.id) as reports_count
  FROM profiles p
  LEFT JOIN listings l ON l.user_id = p.id
  LEFT JOIN reviews r ON r.seller_id = p.id
  LEFT JOIN user_points up ON up.user_id = p.id
  LEFT JOIN reports rep ON rep.reported_user_id = p.id
  GROUP BY p.id, p.full_name, p.avatar_url, p.phone, p.created_at, up.total_points, up.level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all actions"
  ON admin_actions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) 
         OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can insert actions"
  ON admin_actions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) 
              OR has_role(auth.uid(), 'moderator'::app_role));

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE daily_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_views;
ALTER PUBLICATION supabase_realtime ADD TABLE user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_actions;