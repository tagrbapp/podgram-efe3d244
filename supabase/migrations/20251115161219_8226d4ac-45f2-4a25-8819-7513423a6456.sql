-- إنشاء جدول تنبيهات المزادات
CREATE TABLE IF NOT EXISTS public.auction_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_reached', 'time_remaining', 'outbid')),
  target_price NUMERIC,
  time_before_end INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, auction_id, alert_type)
);

-- إنشاء جدول دعوات المزادات الخاصة
CREATE TABLE IF NOT EXISTS public.auction_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(auction_id, invitee_id)
);

-- إنشاء جدول إحصائيات المزايدين
CREATE TABLE IF NOT EXISTS public.bidder_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_bids INTEGER DEFAULT 0,
  won_auctions INTEGER DEFAULT 0,
  avg_rating NUMERIC DEFAULT 0,
  reliability_score INTEGER DEFAULT 100,
  payment_speed_rating NUMERIC DEFAULT 0,
  communication_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول تقييمات المزايدين
CREATE TABLE IF NOT EXISTS public.bidder_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_type TEXT NOT NULL CHECK (review_type IN ('payment_speed', 'communication', 'reliability')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bidder_id, reviewer_id, auction_id, review_type)
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.auction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidder_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidder_reviews ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول auction_alerts
CREATE POLICY "Users can manage their own alerts"
ON public.auction_alerts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- سياسات RLS لجدول auction_invitations
CREATE POLICY "Users can view invitations they sent or received"
ON public.auction_invitations FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invitations"
ON public.auction_invitations FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update their invitations"
ON public.auction_invitations FOR UPDATE
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);

-- سياسات RLS لجدول bidder_stats
CREATE POLICY "Anyone can view bidder stats"
ON public.bidder_stats FOR SELECT
USING (true);

CREATE POLICY "Users can update their own stats"
ON public.bidder_stats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
ON public.bidder_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- سياسات RLS لجدول bidder_reviews
CREATE POLICY "Anyone can view bidder reviews"
ON public.bidder_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.bidder_reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != bidder_id);

CREATE POLICY "Reviewers can update their own reviews"
ON public.bidder_reviews FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- إنشاء triggers لتحديث إحصائيات المزايدين
CREATE OR REPLACE FUNCTION update_bidder_stats_on_bid()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bidder_stats (user_id, total_bids)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_bids = public.bidder_stats.total_bids + 1,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_bidder_stats_on_win()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.highest_bidder_id IS NOT NULL THEN
    INSERT INTO public.bidder_stats (user_id, won_auctions)
    VALUES (NEW.highest_bidder_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET won_auctions = public.bidder_stats.won_auctions + 1,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_bidder_stats_on_review()
RETURNS TRIGGER AS $$
DECLARE
  total_reviews INTEGER;
  sum_ratings NUMERIC;
BEGIN
  -- حساب المتوسط الجديد للتقييمات
  SELECT COUNT(*), AVG(rating) INTO total_reviews, sum_ratings
  FROM public.bidder_reviews
  WHERE bidder_id = NEW.bidder_id;

  -- تحديث الإحصائيات
  INSERT INTO public.bidder_stats (user_id, avg_rating)
  VALUES (NEW.bidder_id, sum_ratings)
  ON CONFLICT (user_id) DO UPDATE
  SET avg_rating = COALESCE(sum_ratings, 0),
      payment_speed_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.bidder_reviews
        WHERE bidder_id = NEW.bidder_id AND review_type = 'payment_speed'
      ),
      communication_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.bidder_reviews
        WHERE bidder_id = NEW.bidder_id AND review_type = 'communication'
      ),
      updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء الـ triggers
DROP TRIGGER IF EXISTS trigger_update_bidder_stats_on_bid ON public.bids;
CREATE TRIGGER trigger_update_bidder_stats_on_bid
AFTER INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION update_bidder_stats_on_bid();

DROP TRIGGER IF EXISTS trigger_update_bidder_stats_on_win ON public.auctions;
CREATE TRIGGER trigger_update_bidder_stats_on_win
AFTER UPDATE ON public.auctions
FOR EACH ROW
WHEN (NEW.status = 'ended' AND OLD.status != 'ended')
EXECUTE FUNCTION update_bidder_stats_on_win();

DROP TRIGGER IF EXISTS trigger_update_bidder_stats_on_review ON public.bidder_reviews;
CREATE TRIGGER trigger_update_bidder_stats_on_review
AFTER INSERT OR UPDATE ON public.bidder_reviews
FOR EACH ROW
EXECUTE FUNCTION update_bidder_stats_on_review();

-- إضافة عمود invited_bidders للمزادات الخاصة إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'auctions' AND column_name = 'invited_bidders'
  ) THEN
    ALTER TABLE public.auctions ADD COLUMN invited_bidders UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'auctions' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE public.auctions ADD COLUMN is_private BOOLEAN DEFAULT false;
  END IF;
END $$;