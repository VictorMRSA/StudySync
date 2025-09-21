-- Remove duplicate trigger to prevent double inserts into class_members
DROP TRIGGER IF EXISTS on_class_created ON public.classes;