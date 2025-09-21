-- Ensure class creators can read their newly created classes and become members automatically
-- 1) Create trigger to add creator as admin member on class creation
DROP TRIGGER IF EXISTS on_class_created_add_creator ON public.classes;
CREATE TRIGGER on_class_created_add_creator
AFTER INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_class();

-- 2) Allow creators to view their own classes (alongside existing member-based policy)
DROP POLICY IF EXISTS "Users can view classes they created" ON public.classes;
CREATE POLICY "Users can view classes they created"
ON public.classes
FOR SELECT
TO authenticated
USING (created_by = auth.uid());