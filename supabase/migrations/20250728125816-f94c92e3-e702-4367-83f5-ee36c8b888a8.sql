
-- Create table for phone authentication
CREATE TABLE public.phone_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  country_code VARCHAR(5) NOT NULL DEFAULT '+91',
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.phone_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for phone_auth
CREATE POLICY "Users can manage their own phone auth" 
  ON public.phone_auth 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create policy for inserting phone auth (allow anonymous for initial OTP generation)
CREATE POLICY "Allow anonymous phone auth creation" 
  ON public.phone_auth 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for selecting phone auth records for OTP verification
CREATE POLICY "Allow phone auth verification" 
  ON public.phone_auth 
  FOR SELECT 
  USING (true);

-- Create policy for updating phone auth records during verification
CREATE POLICY "Allow phone auth updates for verification" 
  ON public.phone_auth 
  FOR UPDATE 
  USING (true);

-- Create function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS VOID AS $$
BEGIN
  UPDATE phone_auth 
  SET otp_code = NULL, otp_expires_at = NULL 
  WHERE otp_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add phone number to customer profiles
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phone_auth_updated_at_trigger
  BEFORE UPDATE ON public.phone_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_auth_updated_at();
