-- Biblioteca IA: ficha de catálogo por material.
-- A origem do documento (turma) continua sendo materials.class_id -> classes.name.
-- Idempotente: pode ser executada mais de uma vez.

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS catalog_summary text,
  ADD COLUMN IF NOT EXISTS topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catalog_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS catalog_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalog_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_catalog_status_check'
  ) THEN
    ALTER TABLE public.materials
      ADD CONSTRAINT materials_catalog_status_check
      CHECK (catalog_status IN ('pending', 'ready', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materials_class_id ON public.materials (class_id);

-- Hoje só admins da turma conseguem UPDATE em materials (policy FOR ALL).
-- O autor do upload precisa poder editar a ficha do próprio material.
DROP POLICY IF EXISTS "Uploaders can update their own materials" ON public.materials;
CREATE POLICY "Uploaders can update their own materials"
ON public.materials
FOR UPDATE
USING (uploaded_by = auth.uid() AND public.is_member(class_id))
WITH CHECK (uploaded_by = auth.uid() AND public.is_member(class_id));

-- Verificação (rodar depois):
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_name = 'materials'
--    AND column_name IN ('subject','catalog_summary','topics','catalog_status','catalog_edited','catalog_updated_at');
-- Esperado: 6 linhas.
