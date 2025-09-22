-- Fix security issues by setting proper search_path for the function
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$;