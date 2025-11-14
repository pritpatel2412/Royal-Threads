
-- Drop the existing restrictive RLS policy
DROP POLICY IF EXISTS "Admin users can access their own data" ON public.admin_users;

-- Create a new policy that allows reading admin_users for login purposes
-- This allows the login function to query the admin_users table
CREATE POLICY "Allow admin login verification" 
  ON public.admin_users 
  FOR SELECT 
  USING (true);

-- Create a policy that only allows authenticated admins to modify admin data
CREATE POLICY "Only authenticated admins can modify admin data" 
  ON public.admin_users 
  FOR ALL 
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()::text 
    AND is_active = true
  ));
