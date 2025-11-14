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
CREATE POLICY "Users can view their own refunds" ON refunds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = refunds.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Allow admins to manage refunds
CREATE POLICY "Admins can manage refunds" ON refunds
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
