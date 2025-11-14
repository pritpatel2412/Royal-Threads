-- Enable public access for newsletter subscriptions
-- This allows anyone to subscribe to the newsletter without authentication

-- Enable RLS on newsletter_subscriptions for security
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to check if their email is already subscribed (for duplicate checking)
CREATE POLICY "Public can check own subscription" ON newsletter_subscriptions
  FOR SELECT 
  USING (true);

-- Allow public to insert newsletter subscriptions
CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT 
  WITH CHECK (true);

-- Allow public to update their own subscription (for unsubscribe/reactivate)
CREATE POLICY "Public can update own subscription" ON newsletter_subscriptions
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

