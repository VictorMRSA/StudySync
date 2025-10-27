-- Adicionar foreign key entre materials.uploaded_by e profiles.id
-- Isso permite que o PostgREST faça JOIN automático entre as tabelas
ALTER TABLE public.materials
ADD CONSTRAINT materials_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;