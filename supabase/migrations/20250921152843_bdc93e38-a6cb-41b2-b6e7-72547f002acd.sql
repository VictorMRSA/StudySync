-- Ensure security definer functions are owned by postgres to bypass RLS inside them
ALTER FUNCTION public.is_member(uuid) OWNER TO postgres;
ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;