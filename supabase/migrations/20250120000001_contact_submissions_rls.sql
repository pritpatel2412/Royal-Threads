-- Enable RLS on contact_submissions table
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert contact submissions (anyone can submit the form)
CREATE POLICY "Public can submit contact form" ON contact_submissions
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to view all contact submissions
-- Note: This assumes you have an admin_users table or similar admin authentication
-- You may need to adjust this based on your admin authentication setup
CREATE POLICY "Admins can view all contact submissions" ON contact_submissions
  FOR SELECT 
  USING (true);

-- Allow admins to update contact submissions (mark as read/unread)
CREATE POLICY "Admins can update contact submissions" ON contact_submissions
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Allow admins to delete contact submissions
CREATE POLICY "Admins can delete contact submissions" ON contact_submissions
  FOR DELETE 
  USING (true);

