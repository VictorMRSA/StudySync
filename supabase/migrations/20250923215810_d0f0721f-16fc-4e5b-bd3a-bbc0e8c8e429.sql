-- Fix the RLS policy for error_reports that's trying to access auth.users
DROP POLICY IF EXISTS "Authenticated users can insert their own error reports" ON public.error_reports;

-- Create a simpler policy that doesn't try to access auth.users table
CREATE POLICY "Authenticated users can insert their own error reports" 
ON public.error_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);