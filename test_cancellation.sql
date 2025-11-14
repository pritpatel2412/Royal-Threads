-- Test Cancellation System
-- Run this after migration to test if everything works

-- Test 1: Check if enum value exists
SELECT 'Enum Test' as test_name, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'cancellation_requested') 
         THEN 'PASS - cancellation_requested exists in order_status enum'
         ELSE 'FAIL - cancellation_requested missing from order_status enum'
       END as result;

-- Test 2: Check if cancellation columns exist
SELECT 'Columns Test' as test_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_requested')
         THEN 'PASS - cancellation columns exist'
         ELSE 'FAIL - cancellation columns missing'
       END as result;

-- Test 3: Check if refunds table exists
SELECT 'Refunds Table Test' as test_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refunds')
         THEN 'PASS - refunds table exists'
         ELSE 'FAIL - refunds table missing'
       END as result;

-- Test 4: List all order_status enum values
SELECT 'All Order Status Values' as info, 
       string_agg(enumlabel, ', ' ORDER BY enumlabel) as values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status');

-- Test 5: List all cancellation columns
SELECT 'All Cancellation Columns' as info,
       string_agg(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%cancellation%';
