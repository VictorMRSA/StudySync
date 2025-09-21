-- Fix recursion by removing self-references in class_members policies
-- 1) Drop problematic policies on class_members
DROP POLICY IF EXISTS "Class admins can manage members" ON public.class_members;
DROP POLICY IF EXISTS "Users can view members of their classes" ON public.class_members;

-- 2) Re-create minimal, non-recursive policies for class_members
-- Allow users to insert themselves (already exists in many setups, recreate to be safe)
DROP POLICY IF EXISTS "Users can join classes" ON public.class_members;
CREATE POLICY "Users can join classes"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own membership rows (no self-reference)
CREATE POLICY "Users can view their own memberships"
ON public.class_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow class creator (owner) to manage members without referencing class_members
CREATE POLICY "Class creator can update members"
ON public.class_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_members.class_id AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_members.class_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Class creator can delete members"
ON public.class_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_members.class_id AND c.created_by = auth.uid()
  )
);

-- Note: classes/assignments/materials policies remain using is_member/is_admin (no self-reference there)