-- test migration - إنشاء جدول واحد بسيط
CREATE TABLE IF NOT EXISTS public.test_bidder_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_bids INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);