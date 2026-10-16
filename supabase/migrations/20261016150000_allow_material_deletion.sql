-- Migration: Permite a exclusão de materiais pelos autores ou administradores
-- Tabela: public.materials

DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;

CREATE POLICY "Users can delete their own materials"
ON public.materials
FOR DELETE
TO authenticated
USING (
  auth.uid() = uploaded_by 
  OR public.is_admin(class_id)
  OR public.is_user_admin()
);
