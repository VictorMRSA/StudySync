
-- Add missing columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS experience_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_level_xp integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0;

-- Add missing columns to materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create error_reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  area text NOT NULL DEFAULT 'Geral',
  description text NOT NULL,
  technical_details jsonb,
  status text NOT NULL DEFAULT 'novo',
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own error reports" ON public.error_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own error reports" ON public.error_reports FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id bigint,
  summary_type text NOT NULL,
  content text NOT NULL,
  generated_by uuid NOT NULL,
  user_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own summaries" ON public.ai_summaries FOR ALL TO authenticated USING (generated_by = auth.uid()) WITH CHECK (generated_by = auth.uid());

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create user_roles table for admin
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Create is_user_admin function
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Create get_admin_stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(total_users bigint, total_profiles bigint, total_classes bigint, total_reports bigint, pending_reports bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.profiles)::bigint as total_users,
    (SELECT count(*) FROM public.profiles)::bigint as total_profiles,
    (SELECT count(*) FROM public.classes)::bigint as total_classes,
    (SELECT count(*) FROM public.error_reports)::bigint as total_reports,
    (SELECT count(*) FROM public.error_reports WHERE status = 'novo')::bigint as pending_reports;
END;
$$;

-- Admin policies for error_reports
CREATE POLICY "Admins can view all error reports" ON public.error_reports FOR SELECT TO authenticated USING (public.is_user_admin());
CREATE POLICY "Admins can update error reports" ON public.error_reports FOR UPDATE TO authenticated USING (public.is_user_admin());

-- Create profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(split_part(NEW.email, '@', 1), 'user_' || substr(NEW.id::text, 1, 8))
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-assign admin to first user
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_first_admin_assignment
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_admin();
