-- Add missing updated_at column to error_reports table
ALTER TABLE public.error_reports 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_error_reports_updated_at ON public.error_reports;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_error_reports_updated_at
  BEFORE UPDATE ON public.error_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();