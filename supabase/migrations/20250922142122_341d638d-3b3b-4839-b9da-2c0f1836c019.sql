-- Add is_admin field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create error_reports table
CREATE TABLE public.error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Geral',
  description TEXT NOT NULL,
  technical_details JSONB,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'resolvido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on error_reports
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for error_reports
CREATE POLICY "Anyone can insert error reports" 
ON public.error_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view error reports" 
ON public.error_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "Only admins can update error reports" 
ON public.error_reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_admin = true
));

-- Set the specific user as admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'victorselles34@gmail.com'
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at on error_reports
CREATE TRIGGER update_error_reports_updated_at
  BEFORE UPDATE ON public.error_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();