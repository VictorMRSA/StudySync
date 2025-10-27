-- Add extracted_text column to materials table
-- This field will store the extracted text content separately from file URLs
ALTER TABLE public.materials 
ADD COLUMN extracted_text TEXT NULL;

COMMENT ON COLUMN public.materials.extracted_text IS 'Extracted text content from uploaded documents. Separate from file_url which may contain Storage URLs in the future.';