-- Make the current user an admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id = '9632317e-a029-4ddb-98b9-0c134a13baf4';