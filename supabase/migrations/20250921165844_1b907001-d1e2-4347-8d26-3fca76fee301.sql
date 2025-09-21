-- Function to fetch a class by invite code securely (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_class_by_invite(invite_code text)
RETURNS TABLE (
  id uuid,
  name text,
  subject text,
  description text,
  invite_code text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.subject, c.description, c.invite_code, c.created_by, c.created_at, c.updated_at
  FROM public.classes c
  WHERE c.invite_code = get_class_by_invite.invite_code
  LIMIT 1;
$$;

-- Tighten permissions: only authenticated users can call it
REVOKE ALL ON FUNCTION public.get_class_by_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_by_invite(text) TO authenticated;