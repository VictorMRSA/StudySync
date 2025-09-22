-- Create a secure function to promote a member to admin, ensuring only class admins can call it
CREATE OR REPLACE FUNCTION public.promote_member_to_admin(_member_id uuid)
RETURNS public.class_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_row public.class_members%rowtype;
BEGIN
  -- Fetch the class_id of the membership row
  SELECT class_id INTO v_class_id FROM public.class_members WHERE id = _member_id;
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'member not found';
  END IF;

  -- Only allow if the caller is an admin of this class
  IF NOT public.is_admin(v_class_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Perform the promotion
  UPDATE public.class_members
  SET role = 'admin'::public.class_role
  WHERE id = _member_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
