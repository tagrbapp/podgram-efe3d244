-- Create achievements table for reward rules
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Trophy',
  achievement_type TEXT NOT NULL, -- 'first_auction', 'level_reached', 'total_bids', 'total_sales', 'points_milestone', etc.
  requirement_value NUMERIC NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_repeatable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  times_earned INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  already_earned BOOLEAN;
BEGIN
  -- Get user statistics
  SELECT 
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.level, 1) as level,
    COALESCE((SELECT COUNT(*) FROM auctions WHERE user_id = _user_id), 0) as total_auctions,
    COALESCE((SELECT COUNT(*) FROM bids WHERE user_id = _user_id), 0) as total_bids,
    COALESCE((SELECT COUNT(*) FROM listings WHERE user_id = _user_id AND status = 'sold'), 0) as total_sales,
    COALESCE((SELECT COUNT(*) FROM listings WHERE user_id = _user_id), 0) as total_listings
  INTO user_stats
  FROM user_points up
  WHERE up.user_id = _user_id;

  -- Check each active achievement
  FOR achievement_record IN 
    SELECT * FROM achievements WHERE is_active = true
  LOOP
    -- Check if already earned (for non-repeatable achievements)
    SELECT EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = _user_id AND achievement_id = achievement_record.id
    ) INTO already_earned;

    -- Skip if already earned and not repeatable
    IF already_earned AND NOT achievement_record.is_repeatable THEN
      CONTINUE;
    END IF;

    -- Check achievement conditions
    IF (
      (achievement_record.achievement_type = 'first_auction' AND user_stats.total_auctions >= achievement_record.requirement_value) OR
      (achievement_record.achievement_type = 'level_reached' AND user_stats.level >= achievement_record.requirement_value) OR
      (achievement_record.achievement_type = 'total_bids' AND user_stats.total_bids >= achievement_record.requirement_value) OR
      (achievement_record.achievement_type = 'total_sales' AND user_stats.total_sales >= achievement_record.requirement_value) OR
      (achievement_record.achievement_type = 'points_milestone' AND user_stats.total_points >= achievement_record.requirement_value) OR
      (achievement_record.achievement_type = 'total_listings' AND user_stats.total_listings >= achievement_record.requirement_value)
    ) THEN
      -- Award the achievement
      IF already_earned AND achievement_record.is_repeatable THEN
        -- Update times earned for repeatable achievements
        UPDATE user_achievements 
        SET times_earned = times_earned + 1,
            earned_at = now()
        WHERE user_id = _user_id AND achievement_id = achievement_record.id;
      ELSE
        -- Insert new achievement
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (_user_id, achievement_record.id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END IF;

      -- Award points
      PERFORM add_points(
        _user_id, 
        achievement_record.reward_points, 
        'إنجاز: ' || achievement_record.name,
        achievement_record.id
      );

      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        _user_id,
        'إنجاز جديد! 🎉',
        'تهانينا! لقد حققت إنجاز "' || achievement_record.name || '" وحصلت على ' || achievement_record.reward_points || ' نقطة',
        'achievement_earned'
      );
    END IF;
  END LOOP;
END;
$$;

-- Update existing triggers to check achievements
CREATE OR REPLACE FUNCTION public.award_points_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM add_points(NEW.user_id, 5, 'إضافة إعلان جديد', NEW.id);
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Update auction creation to check achievements
CREATE OR REPLACE FUNCTION public.check_achievements_on_auction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_achievements_on_auction
  AFTER INSERT ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_achievements_on_auction();

-- Update bid trigger to check achievements
CREATE OR REPLACE FUNCTION public.update_bidder_stats_on_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.bidder_stats (user_id, total_bids)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_bids = public.bidder_stats.total_bids + 1,
      updated_at = now();
  
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, achievement_type, requirement_value, reward_points, is_repeatable) VALUES
('أول مزاد', 'قم بإنشاء أول مزاد لك', 'Gavel', 'first_auction', 1, 100, false),
('أول إعلان', 'قم بإضافة أول إعلان', 'Package', 'total_listings', 1, 50, false),
('مزايد نشط', 'قم بالمزايدة في 10 مزادات', 'TrendingUp', 'total_bids', 10, 150, false),
('بائع محترف', 'قم ببيع 5 منتجات', 'Award', 'total_sales', 5, 200, false),
('الوصول للمستوى 5', 'وصلت إلى المستوى 5', 'Star', 'level_reached', 5, 250, false),
('الوصول للمستوى 10', 'وصلت إلى المستوى 10', 'Crown', 'level_reached', 10, 500, false),
('جامع النقاط', 'اجمع 1000 نقطة', 'Trophy', 'points_milestone', 1000, 300, false),
('مزايد خبير', 'قم بالمزايدة في 50 مزاد', 'Medal', 'total_bids', 50, 400, false),
('بائع متميز', 'قم ببيع 20 منتج', 'ShoppingBag', 'total_sales', 20, 600, false);