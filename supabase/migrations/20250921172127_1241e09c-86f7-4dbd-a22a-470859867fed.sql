-- Function to get all members of a class (for users who are members of that class)
CREATE OR REPLACE FUNCTION public.get_class_members(_class_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role class_role,
  joined_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.id, cm.user_id, cm.role, cm.joined_at
  FROM public.class_members cm
  WHERE cm.class_id = _class_id
    AND is_member(_class_id); -- Only users who are members can see all members
$$;