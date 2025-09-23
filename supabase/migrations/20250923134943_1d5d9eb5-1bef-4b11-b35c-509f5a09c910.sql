-- Add priority/importance field to events table
ALTER TABLE public.events 
ADD COLUMN priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5);

-- Add a comment to explain priority levels
COMMENT ON COLUMN public.events.priority IS '1=Muito Alta, 2=Alta, 3=Média, 4=Baixa, 5=Muito Baixa';

-- Update existing events to have default medium priority
UPDATE public.events SET priority = 3 WHERE priority IS NULL;