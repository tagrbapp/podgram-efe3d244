-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Admins can view all actions" ON public.admin_actions;

-- Create new policy for admins to view all actions
CREATE POLICY "Admins can view all actions"
ON public.admin_actions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create new policy for moderators to view only their own actions
CREATE POLICY "Moderators can view their own actions"
ON public.admin_actions
FOR SELECT
USING (
  has_role(auth.uid(), 'moderator'::app_role) 
  AND admin_id = auth.uid()
);