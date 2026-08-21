
-- Alter events table to match code expectations
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS all_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 3;

-- Alter classes table to add missing columns (subject and invite_code already exist from initial migration)
-- Only add created_by if not present
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS invite_code text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'homework',
  due_date timestamptz,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view class assignments" ON public.assignments;
CREATE POLICY "Members can view class assignments" ON public.assignments FOR SELECT TO authenticated
  USING (class_id IN (SELECT cm.class_id FROM class_members cm WHERE cm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can insert assignments" ON public.assignments;
CREATE POLICY "Members can insert assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (class_id IN (SELECT cm.class_id FROM class_members cm WHERE cm.user_id = auth.uid()) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Owners can update assignments" ON public.assignments;
CREATE POLICY "Owners can update assignments" ON public.assignments FOR UPDATE TO authenticated
  USING (class_id IN (SELECT c.id FROM classes c WHERE c.created_by = auth.uid()) OR created_by = auth.uid());
DROP POLICY IF EXISTS "Owners can delete assignments" ON public.assignments;
CREATE POLICY "Owners can delete assignments" ON public.assignments FOR DELETE TO authenticated
  USING (class_id IN (SELECT c.id FROM classes c WHERE c.created_by = auth.uid()) OR created_by = auth.uid());

-- Create get_class_members function
DROP FUNCTION IF EXISTS public.get_class_members(uuid);
CREATE OR REPLACE FUNCTION public.get_class_members(_class_id uuid)
RETURNS TABLE(id uuid, user_id uuid, role text, joined_at timestamptz, class_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.id, cm.user_id, cm.role::text, cm.joined_at, cm.class_id
  FROM class_members cm
  WHERE cm.class_id = _class_id;
$$;

-- Create get_member_counts function
DROP FUNCTION IF EXISTS public.get_member_counts(uuid[]);
CREATE OR REPLACE FUNCTION public.get_member_counts(_class_ids uuid[])
RETURNS TABLE(class_id uuid, member_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.class_id, count(*)::bigint as member_count
  FROM class_members cm
  WHERE cm.class_id = ANY(_class_ids)
  GROUP BY cm.class_id;
$$;

-- Create get_class_by_invite function
DROP FUNCTION IF EXISTS public.get_class_by_invite(text);
CREATE OR REPLACE FUNCTION public.get_class_by_invite(_invite_code text)
RETURNS TABLE(id uuid, name text, description text, subject text, invite_code text, created_by uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.description, c.subject, c.invite_code, c.created_by
  FROM classes c
  WHERE c.invite_code = _invite_code;
$$;
