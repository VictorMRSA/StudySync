-- Remove duplicate trigger causing double membership insert
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='classes' AND t.tgname='on_class_created'
  ) THEN
    DROP TRIGGER on_class_created ON public.classes;
  END IF;
END $$;

-- Keep a single trigger that adds the creator as admin
-- Optionally, ensure our intended trigger exists
CREATE TRIGGER IF NOT EXISTS on_class_created_add_creator
AFTER INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_class();