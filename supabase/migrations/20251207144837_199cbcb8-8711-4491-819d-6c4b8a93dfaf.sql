-- Create auction_views table to track auction views
CREATE TABLE public.auction_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(auction_id, view_date, user_id)
);

-- Enable RLS
ALTER TABLE public.auction_views ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view auction views stats" ON public.auction_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert view" ON public.auction_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners and admins can view detailed stats" ON public.auction_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auctions a WHERE a.id = auction_id AND a.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Add views column to auctions table
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Create function to get auction views analytics
CREATE OR REPLACE FUNCTION get_auction_views_analytics(
  _auction_id UUID,
  _days INTEGER DEFAULT 30
)
RETURNS TABLE (
  view_date DATE,
  total_views BIGINT,
  unique_viewers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.view_date,
    SUM(av.views_count)::BIGINT as total_views,
    COUNT(DISTINCT av.user_id)::BIGINT as unique_viewers
  FROM auction_views av
  WHERE av.auction_id = _auction_id
    AND av.view_date >= CURRENT_DATE - _days
  GROUP BY av.view_date
  ORDER BY av.view_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user auctions analytics summary
CREATE OR REPLACE FUNCTION get_user_auctions_analytics(
  _user_id UUID,
  _days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_views', COALESCE(SUM(av.views_count), 0),
    'unique_viewers', COUNT(DISTINCT av.user_id),
    'total_auctions', (SELECT COUNT(*) FROM auctions WHERE user_id = _user_id AND deleted_at IS NULL),
    'active_auctions', (SELECT COUNT(*) FROM auctions WHERE user_id = _user_id AND status = 'active' AND deleted_at IS NULL),
    'total_bids', (SELECT COUNT(*) FROM bids b JOIN auctions a ON b.auction_id = a.id WHERE a.user_id = _user_id),
    'avg_views_per_auction', COALESCE(
      ROUND(SUM(av.views_count)::NUMERIC / NULLIF((SELECT COUNT(*) FROM auctions WHERE user_id = _user_id AND deleted_at IS NULL), 0), 2),
      0
    )
  ) INTO result
  FROM auction_views av
  JOIN auctions a ON av.auction_id = a.id
  WHERE a.user_id = _user_id
    AND av.view_date >= CURRENT_DATE - _days;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX idx_auction_views_auction_date ON auction_views(auction_id, view_date);
CREATE INDEX idx_auction_views_user ON auction_views(user_id);