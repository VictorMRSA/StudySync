-- Create enum for user roles in classes
CREATE TYPE public.class_role AS ENUM ('admin', 'member');

-- Create enum for content status
CREATE TYPE public.content_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for assignment types
CREATE TYPE public.assignment_type AS ENUM ('exam', 'homework', 'project');

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create class members table
CREATE TABLE public.class_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.class_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  uploaded_by UUID NOT NULL,
  status public.content_status NOT NULL DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Create assignments table for exams, homework, projects
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type public.assignment_type NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  status public.content_status NOT NULL DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classes
CREATE POLICY "Users can view classes they are members of" 
ON public.classes 
FOR SELECT 
USING (
  id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Class admins can update classes" 
ON public.classes 
FOR UPDATE 
USING (
  id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for class_members
CREATE POLICY "Users can view members of their classes" 
ON public.class_members 
FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Class admins can manage members" 
ON public.class_members 
FOR ALL 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can join classes" 
ON public.class_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for materials
CREATE POLICY "Users can view approved materials in their classes" 
ON public.materials 
FOR SELECT 
USING (
  (status = 'approved' OR uploaded_by = auth.uid()) AND
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Class members can upload materials" 
ON public.materials 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Class admins can manage materials" 
ON public.materials 
FOR ALL 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for assignments
CREATE POLICY "Users can view approved assignments in their classes" 
ON public.assignments 
FOR SELECT 
USING (
  (status = 'approved' OR created_by = auth.uid()) AND
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Class members can create assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Class admins can manage assignments" 
ON public.assignments 
FOR ALL 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically make class creator an admin
CREATE OR REPLACE FUNCTION public.handle_new_class()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.class_members (class_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-add creator as admin
CREATE TRIGGER on_class_created
AFTER INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_class();