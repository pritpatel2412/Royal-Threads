
-- First, let's make sure the admin user exists and check the current data
SELECT * FROM public.admin_users WHERE email = 'admin@gmail.com';

-- If the user doesn't exist, let's insert it again with proper values
INSERT INTO public.admin_users (email, password_hash, is_active)
VALUES ('admin@gmail.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = 'admin',
  is_active = true;

-- Let's also check the current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'admin_users';
