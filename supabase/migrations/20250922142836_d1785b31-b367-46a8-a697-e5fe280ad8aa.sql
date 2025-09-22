-- Create admin function to get user statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
  total_users INTEGER,
  total_profiles INTEGER,
  total_classes INTEGER,
  total_reports INTEGER,
  pending_reports INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM auth.users) as total_users,
    (SELECT COUNT(*)::INTEGER FROM public.profiles) as total_profiles,
    (SELECT COUNT(*)::INTEGER FROM public.classes) as total_classes,
    (SELECT COUNT(*)::INTEGER FROM public.error_reports) as total_reports,
    (SELECT COUNT(*)::INTEGER FROM public.error_reports WHERE status = 'novo') as pending_reports
  WHERE public.is_user_admin();
$$;

-- Update profiles policies to allow admins to count profiles
CREATE POLICY "Admins can view all profiles for statistics" 
ON public.profiles 
FOR SELECT 
USING (public.is_user_admin());