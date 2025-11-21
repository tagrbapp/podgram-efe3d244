-- Create the add_points function that is required for user registration
CREATE OR REPLACE FUNCTION public.add_points(
  _user_id UUID,
  _points INTEGER,
  _reason TEXT,
  _reference_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user_points
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (_user_id, _points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + _points,
    level = CASE 
      WHEN (user_points.total_points + _points) >= 1000 THEN 10
      WHEN (user_points.total_points + _points) >= 900 THEN 9
      WHEN (user_points.total_points + _points) >= 800 THEN 8
      WHEN (user_points.total_points + _points) >= 700 THEN 7
      WHEN (user_points.total_points + _points) >= 600 THEN 6
      WHEN (user_points.total_points + _points) >= 500 THEN 5
      WHEN (user_points.total_points + _points) >= 400 THEN 4
      WHEN (user_points.total_points + _points) >= 300 THEN 3
      WHEN (user_points.total_points + _points) >= 200 THEN 2
      ELSE 1
    END,
    updated_at = NOW();

  -- Insert into points_history
  INSERT INTO public.points_history (user_id, points, reason, reference_id)
  VALUES (_user_id, _points, _reason, _reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;