
-- Create a checkout sessions table to track payment attempts
CREATE TABLE public.checkout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  card_last_four TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkout sessions
CREATE POLICY "Users can view own checkout sessions" 
  ON public.checkout_sessions 
  FOR SELECT 
  USING (auth.uid() = customer_id);

-- Allow inserting checkout sessions
CREATE POLICY "Users can create checkout sessions" 
  ON public.checkout_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

-- Admins can view all checkout sessions
CREATE POLICY "Admins can view all checkout sessions" 
  ON public.checkout_sessions 
  FOR ALL 
  USING (true);

-- Add payment_intent_id to orders table for tracking
ALTER TABLE public.orders ADD COLUMN payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN card_last_four TEXT;
