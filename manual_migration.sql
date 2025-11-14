-- Manual Migration for Cancellation System
-- Run this in Supabase SQL Editor

-- First, add 'cancellation_requested' to the order_status enum type
DO $$
BEGIN
    -- Check if the enum type exists and add the new value
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        -- Add the new value if it doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'cancellation_requested') THEN
            ALTER TYPE order_status ADD VALUE 'cancellation_requested';
        END IF;
    ELSE
        -- If enum doesn't exist, create it with all values
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancellation_requested');
    END IF;
END
$$;

-- Add cancellation and refund fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  refund_amount DECIMAL(10,2) NOT NULL,
  cancellation_fee DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Add RLS policies for refunds table
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read refunds for their orders
CREATE POLICY IF NOT EXISTS "Users can view their own refunds" ON refunds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = refunds.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Allow admins to manage refunds
CREATE POLICY IF NOT EXISTS "Admins can manage refunds" ON refunds
FOR ALL USING (auth.role() = 'authenticated');

-- Update order_status_history table to include more detailed notes
ALTER TABLE order_status_history 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to explain the cancellation fee structure
COMMENT ON COLUMN orders.cancellation_fee IS '10% of order total retained as cancellation fee';
COMMENT ON COLUMN orders.refund_amount IS '90% of order total refunded to customer';
COMMENT ON COLUMN orders.cancellation_requested IS 'Whether customer has requested cancellation';
COMMENT ON COLUMN orders.cancellation_request_reason IS 'Reason provided by customer for cancellation request';
COMMENT ON COLUMN orders.admin_response IS 'Admin response to cancellation request';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%cancellation%' 
ORDER BY column_name;

-- Verify the enum value was added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
ORDER BY enumlabel;
