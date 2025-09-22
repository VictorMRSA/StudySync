-- Fix RLS policies on error_reports to use SECURITY DEFINER function is_user_admin()
-- This avoids circular/denied access due to selecting from profiles inside a policy

-- Ensure RLS remains enabled
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that depend on selecting from profiles
DROP POLICY IF EXISTS "Only admins can view error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Only admins can update error reports" ON public.error_reports;

-- Recreate policies using the SECURITY DEFINER function
CREATE POLICY "Only admins can view error reports"
ON public.error_reports
FOR SELECT
USING (public.is_user_admin());

CREATE POLICY "Only admins can update error reports"
ON public.error_reports
FOR UPDATE
USING (public.is_user_admin());