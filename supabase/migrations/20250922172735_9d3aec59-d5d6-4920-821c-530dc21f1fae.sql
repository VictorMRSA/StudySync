-- Ensure UPDATE policy includes WITH CHECK to avoid RLS failures on updated rows
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can update error reports" ON public.error_reports;
CREATE POLICY "Only admins can update error reports"
ON public.error_reports
FOR UPDATE
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());