-- Update the RLS policy for class_members to allow class admins to update member roles
DROP POLICY IF EXISTS "Class creator can update members" ON public.class_members;

CREATE POLICY "Class admins can update members" 
ON public.class_members 
FOR UPDATE 
USING (public.is_admin(class_id))
WITH CHECK (public.is_admin(class_id));

-- Also update the DELETE policy to be consistent
DROP POLICY IF EXISTS "Class creator can delete members" ON public.class_members;

CREATE POLICY "Class admins can delete members" 
ON public.class_members 
FOR DELETE 
USING (public.is_admin(class_id));