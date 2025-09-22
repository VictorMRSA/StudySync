-- Fix security vulnerability in error_reports table

-- Add user_id column to properly link reports to authenticated users
ALTER TABLE public.error_reports 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Drop the insecure policy that allows anyone to insert reports
DROP POLICY IF EXISTS "Anyone can insert error reports" ON public.error_reports;

-- Create secure policy that only allows authenticated users to insert their own reports
CREATE POLICY "Authenticated users can insert their own error reports" 
ON public.error_reports 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow users to view their own error reports
CREATE POLICY "Users can view their own error reports" 
ON public.error_reports 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);