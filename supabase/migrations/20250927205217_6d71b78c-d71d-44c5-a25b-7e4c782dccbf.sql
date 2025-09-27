-- Fix security vulnerability in error_reports table
-- Issue: User email addresses stored in plain text and potentially accessible to admins

-- First, let's check current policies and make them more restrictive
DROP POLICY IF EXISTS "Only admins can view error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Users can view their own error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Only admins can update error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Authenticated users can insert their own error reports" ON public.error_reports;

-- Create more secure policies that strictly limit access
-- Users can only view their own reports (no admin access to personal data)
CREATE POLICY "Users can view only their own error reports" 
ON public.error_reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own reports with proper validation
CREATE POLICY "Users can insert only their own error reports" 
ON public.error_reports 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND user_email IS NOT NULL
  AND LENGTH(user_email) > 0
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Admins can only update status fields, not view personal data
-- Create a separate function for admin operations that doesn't expose emails
CREATE OR REPLACE FUNCTION public.update_error_report_status_admin(_report_id uuid, _new_status text)
RETURNS TABLE(id uuid, status text, resolved_at timestamp with time zone, resolved_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure only admins can run it
  IF NOT public.is_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Validate status
  IF _new_status NOT IN ('novo', 'em_andamento', 'resolvido', 'rejeitado') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  -- Update only status-related fields, never expose user_email
  RETURN QUERY
  UPDATE public.error_reports AS er
  SET
    status = _new_status,
    resolved_at = CASE WHEN _new_status = 'resolvido' THEN now() ELSE NULL END,
    resolved_by = CASE WHEN _new_status = 'resolvido' THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE er.id = _report_id
  RETURNING er.id, er.status, er.resolved_at, er.resolved_by;
END;
$$;

-- Create a function for admins to get report statistics without exposing emails
CREATE OR REPLACE FUNCTION public.get_error_reports_stats()
RETURNS TABLE(
  total_reports integer,
  pending_reports integer,
  resolved_reports integer,
  reports_by_area jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*)::integer FROM public.error_reports) as total_reports,
    (SELECT COUNT(*)::integer FROM public.error_reports WHERE status = 'novo') as pending_reports,
    (SELECT COUNT(*)::integer FROM public.error_reports WHERE status = 'resolvido') as resolved_reports,
    (SELECT jsonb_object_agg(area, count) FROM (
      SELECT area, COUNT(*)::integer as count 
      FROM public.error_reports 
      GROUP BY area
    ) as area_counts) as reports_by_area
  WHERE public.is_user_admin();
$$;

-- Create a function for admins to get anonymized report list (no emails)
CREATE OR REPLACE FUNCTION public.get_error_reports_admin()
RETURNS TABLE(
  id uuid,
  area text,
  description text,
  status text,
  created_at timestamp with time zone,
  resolved_at timestamp with time zone,
  technical_details jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    er.id,
    er.area,
    er.description,
    er.status,
    er.created_at,
    er.resolved_at,
    er.technical_details
  FROM public.error_reports er
  WHERE public.is_user_admin()
  ORDER BY er.created_at DESC;
$$;