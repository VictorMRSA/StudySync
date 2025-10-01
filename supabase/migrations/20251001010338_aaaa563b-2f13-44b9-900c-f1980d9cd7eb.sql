-- Create ai_summaries table to store AI-generated summaries
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add columns to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Enable RLS on ai_summaries
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_summaries
CREATE POLICY "Users can view summaries of materials in their classes"
ON public.ai_summaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.materials m
    WHERE m.id = ai_summaries.material_id
    AND is_member(m.class_id)
  )
);

CREATE POLICY "Users can create summaries for materials in their classes"
ON public.ai_summaries
FOR INSERT
WITH CHECK (
  auth.uid() = generated_by
  AND EXISTS (
    SELECT 1 FROM public.materials m
    WHERE m.id = ai_summaries.material_id
    AND is_member(m.class_id)
  )
);

CREATE POLICY "Users can update their own summaries"
ON public.ai_summaries
FOR UPDATE
USING (auth.uid() = generated_by);

CREATE POLICY "Users can delete their own summaries"
ON public.ai_summaries
FOR DELETE
USING (auth.uid() = generated_by);

-- Create trigger to update updated_at
CREATE TRIGGER update_ai_summaries_updated_at
  BEFORE UPDATE ON public.ai_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();