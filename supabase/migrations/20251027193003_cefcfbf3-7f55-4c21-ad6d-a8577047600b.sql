-- Fix notifications RLS policy to prevent notification forgery
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a new policy that only allows service role to insert notifications
CREATE POLICY "Only service role can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  -- Only allow if the request is from service role (edge functions with service role key)
  auth.jwt()->>'role' = 'service_role'
);