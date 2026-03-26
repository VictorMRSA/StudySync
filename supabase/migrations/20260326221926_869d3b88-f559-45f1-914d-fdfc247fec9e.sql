
-- Alter events table to match code expectations
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS all_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 3;

-- Alter classes table to add missing columns
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update created_by from owner_id for existing rows
UPDATE public.classes SET created_by = owner_id WHERE created_by IS NULL;

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id bigint NOT NULL,
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

CREATE POLICY "Members can view class assignments" ON public.assignments FOR SELECT TO authenticated
  USING (class_id IN (SELECT class_id FROM class_memberships WHERE user_id = auth.uid()));
CREATE POLICY "Members can insert assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (class_id IN (SELECT class_id FROM class_memberships WHERE user_id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Owners can update assignments" ON public.assignments FOR UPDATE TO authenticated
  USING (class_id IN (SELECT c.id FROM classes c WHERE c.owner_id = auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Owners can delete assignments" ON public.assignments FOR DELETE TO authenticated
  USING (class_id IN (SELECT c.id FROM classes c WHERE c.owner_id = auth.uid()) OR created_by = auth.uid());

-- Create get_class_members function
CREATE OR REPLACE FUNCTION public.get_class_members(_class_id bigint)
RETURNS TABLE(id bigint, user_id uuid, role text, joined_at timestamptz, class_id bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.id, cm.user_id, cm.role, cm.joined_at, cm.class_id
  FROM class_memberships cm
  WHERE cm.class_id = _class_id;
$$;

-- Create get_member_counts function
CREATE OR REPLACE FUNCTION public.get_member_counts(_class_ids bigint[])
RETURNS TABLE(class_id bigint, member_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.class_id, count(*)::bigint as member_count
  FROM class_memberships cm
  WHERE cm.class_id = ANY(_class_ids)
  GROUP BY cm.class_id;
$$;

-- Create get_class_by_invite function
CREATE OR REPLACE FUNCTION public.get_class_by_invite(invite_code text)
RETURNS TABLE(id bigint, name text, description text, subject text, invite_code text, owner_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.description, c.subject, c.invite_code, c.owner_id
  FROM classes c
  WHERE c.invite_code = get_class_by_invite.invite_code;
$$;
