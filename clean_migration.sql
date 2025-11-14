-- Clean Migration - Only adds missing parts
-- Run this in Supabase SQL Editor

-- Step 1: Add 'cancellation_requested' to order_status enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'cancellation_requested') THEN
            ALTER TYPE order_status ADD VALUE 'cancellation_requested';
        END IF;
    END IF;
END
$$;

-- Step 2: Add cancellation columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Step 3: Create refunds table if it doesn't exist
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

-- Step 4: Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Step 5: Enable RLS on refunds table
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Step 6: Add policies if they don't exist (using DROP IF EXISTS first)
DROP POLICY IF EXISTS "Users can view their own refunds" ON refunds;
CREATE POLICY "Users can view their own refunds" ON refunds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = refunds.order_id 
    AND orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage refunds" ON refunds;
CREATE POLICY "Admins can manage refunds" ON refunds
FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Add notes column to order_status_history
ALTER TABLE order_status_history 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 8: Verification queries
SELECT 'Migration Complete!' as status;

-- Check enum values
SELECT 'Order Status Values:' as info, 
       string_agg(enumlabel, ', ' ORDER BY enumlabel) as values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status');

-- Check cancellation columns
SELECT 'Cancellation Columns:' as info,
       string_agg(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%cancellation%';
