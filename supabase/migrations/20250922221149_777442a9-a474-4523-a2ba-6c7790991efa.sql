-- Add DELETE policy for classes table
CREATE POLICY "Class admins can delete classes" 
ON public.classes 
FOR DELETE 
USING (public.is_admin(id));

-- Also add CASCADE deletion for related tables to prevent orphaned records
-- First, check if we need to add foreign key constraints with CASCADE

-- For class_members table
ALTER TABLE public.class_members
DROP CONSTRAINT IF EXISTS class_members_class_id_fkey;

ALTER TABLE public.class_members
ADD CONSTRAINT class_members_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- For materials table  
ALTER TABLE public.materials
DROP CONSTRAINT IF EXISTS materials_class_id_fkey;

ALTER TABLE public.materials
ADD CONSTRAINT materials_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- For assignments table
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS assignments_class_id_fkey;

ALTER TABLE public.assignments
ADD CONSTRAINT assignments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;