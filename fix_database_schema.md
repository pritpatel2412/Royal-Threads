# Database Schema Fix Guide

## 🚨 Error: Missing Cancellation Columns and Enum Value

आपको यह error आ रहा है क्योंकि database में cancellation related columns नहीं हैं और `order_status` enum में `cancellation_requested` value नहीं है।

## 🔧 Solution 1: Manual Migration (Recommended)

### Step 1: Supabase Dashboard पर जाएं
1. [Supabase Dashboard](https://supabase.com/dashboard) पर जाएं
2. अपना project select करें
3. Left sidebar में "SQL Editor" पर click करें

### Step 2: Migration Code Run करें
नीचे दिया गया SQL code copy करके SQL Editor में paste करें और run करें:

```sql
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
```

### Step 3: Verify Columns Added
Verification के लिए यह query run करें:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%cancellation%' 
ORDER BY column_name;
```

## 🔧 Solution 2: Local Development (Alternative)

अगर आप local development कर रहे हैं:

```bash
# Docker Desktop start करें
# फिर यह command run करें
npx supabase db reset
```

## ✅ After Migration

Migration के बाद:
1. Page को refresh करें
2. Cancellation request try करें
3. Error नहीं आना चाहिए

## 🐛 Fallback System

अगर migration नहीं कर सकते तो भी system काम करेगा क्योंकि मैंने fallback code add किया है जो:
- पहले full update try करता है
- अगर fail हो जाए तो basic update करता है
- System crash नहीं होगा

## 📞 Support

अगर कोई issue आए तो:
1. Browser console check करें
2. Supabase logs check करें
3. Error message share करें
