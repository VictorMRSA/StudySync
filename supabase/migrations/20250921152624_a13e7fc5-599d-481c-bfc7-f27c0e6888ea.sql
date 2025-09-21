-- Fix RLS infinite recursion by using SECURITY DEFINER helper functions
-- 1) Helper functions
CREATE OR REPLACE FUNCTION public.is_member(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2) Update policies on class_members
DROP POLICY IF EXISTS "Class admins can manage members" ON public.class_members;
DROP POLICY IF EXISTS "Users can view members of their classes" ON public.class_members;

CREATE POLICY "Class admins can manage members"
ON public.class_members
FOR ALL
TO authenticated
USING (public.is_admin(class_id))
WITH CHECK (public.is_admin(class_id));

CREATE POLICY "Users can view members of their classes"
ON public.class_members
FOR SELECT
TO authenticated
USING (public.is_member(class_id));

-- Keep existing INSERT policy: "Users can join classes" (auth.uid() = user_id)

-- 3) Update policies on classes
DROP POLICY IF EXISTS "Class admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Users can view classes they are members of" ON public.classes;

CREATE POLICY "Class admins can update classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (public.is_admin(id));

CREATE POLICY "Users can view classes they are members of"
ON public.classes
FOR SELECT
TO authenticated
USING (public.is_member(id));

-- Keep existing INSERT policy: "Users can create classes" (auth.uid() = created_by)

-- 4) Update policies on assignments
DROP POLICY IF EXISTS "Class admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Class members can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view approved assignments in their classes" ON public.assignments;

CREATE POLICY "Class admins can manage assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (public.is_admin(class_id))
WITH CHECK (public.is_admin(class_id));

CREATE POLICY "Class members can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = created_by) AND public.is_member(class_id));

CREATE POLICY "Users can view approved assignments in their classes"
ON public.assignments
FOR SELECT
TO authenticated
USING (((status = 'approved') OR (created_by = auth.uid())) AND public.is_member(class_id));

-- 5) Update policies on materials
DROP POLICY IF EXISTS "Class admins can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Class members can upload materials" ON public.materials;
DROP POLICY IF EXISTS "Users can view approved materials in their classes" ON public.materials;

CREATE POLICY "Class admins can manage materials"
ON public.materials
FOR ALL
TO authenticated
USING (public.is_admin(class_id))
WITH CHECK (public.is_admin(class_id));

CREATE POLICY "Class members can upload materials"
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = uploaded_by) AND public.is_member(class_id));

CREATE POLICY "Users can view approved materials in their classes"
ON public.materials
FOR SELECT
TO authenticated
USING (((status = 'approved') OR (uploaded_by = auth.uid())) AND public.is_member(class_id));