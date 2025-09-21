-- Function: get_member_counts(_class_ids uuid[])
-- Returns the total number of members per class for classes the current user belongs to.
-- Uses SECURITY DEFINER with is_member() to restrict visibility to the caller's classes.
CREATE OR REPLACE FUNCTION public.get_member_counts(_class_ids uuid[])
RETURNS TABLE (class_id uuid, member_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.class_id, COUNT(*)::integer AS member_count
  FROM public.class_members cm
  WHERE cm.class_id = ANY (_class_ids)
    AND is_member(cm.class_id)
  GROUP BY cm.class_id;
$$;