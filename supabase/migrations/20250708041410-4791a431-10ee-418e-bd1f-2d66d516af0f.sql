
-- Insert a test admin user with the credentials admin@gmail.com / admin
-- Note: In a real application, passwords should be properly hashed
-- For this demo, we'll store the password as plain text for simplicity
INSERT INTO public.admin_users (email, password_hash, is_active)
VALUES ('admin@gmail.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = 'admin',
  is_active = true;
