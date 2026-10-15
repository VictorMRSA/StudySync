-- Fase 1 (Leitor Fiel + RAG): bucket para guardar os arquivos originais dos materiais.
-- Leitura pública (necessária para o visualizador abrir o PDF por URL).
-- Escrita/remoção apenas pelo dono, dentro da pasta {user_id}/...

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true,
  20971520, -- 20 MB (mesmo limite do frontend)
  NULL
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Material files are publicly accessible" ON storage.objects;
CREATE POLICY "Material files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Users can upload their own material files" ON storage.objects;
CREATE POLICY "Users can upload their own material files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own material files" ON storage.objects;
CREATE POLICY "Users can delete their own material files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
