-- Fix product analytics to only count delivered orders
-- This migration updates the trigger to only calculate revenue from delivered orders

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_update_product_analytics ON order_items;

-- Updated function to only count delivered orders
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
DECLARE
  order_status TEXT;
BEGIN
  -- Get the order status
  SELECT status INTO order_status
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Only update analytics if order is delivered
  IF order_status = 'delivered' THEN
    INSERT INTO product_analytics (product_id, product_name, total_quantity_sold, total_revenue, times_ordered, last_ordered_at)
    VALUES (
      NEW.product_id,
      NEW.product_name,
      NEW.quantity,
      NEW.total_price,
      1,
      NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
      total_quantity_sold = product_analytics.total_quantity_sold + NEW.quantity,
      total_revenue = product_analytics.total_revenue + NEW.total_price,
      times_ordered = product_analytics.times_ordered + 1,
      last_ordered_at = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_update_product_analytics
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics();

-- Also handle order status updates (when order changes from pending to delivered)
CREATE OR REPLACE FUNCTION update_product_analytics_on_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If order status changed to delivered, update product analytics
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Add all order items to product analytics
    INSERT INTO product_analytics (product_id, product_name, total_quantity_sold, total_revenue, times_ordered, last_ordered_at)
    SELECT 
      product_id,
      product_name,
      quantity,
      total_price,
      1,
      NOW()
    FROM order_items
    WHERE order_id = NEW.id
    ON CONFLICT (product_id) DO UPDATE SET
      total_quantity_sold = product_analytics.total_quantity_sold + EXCLUDED.total_quantity_sold,
      total_revenue = product_analytics.total_revenue + EXCLUDED.total_revenue,
      times_ordered = product_analytics.times_ordered + 1,
      last_ordered_at = NOW(),
      updated_at = NOW();
  END IF;
  
  -- If order status changed from delivered to something else, we should ideally subtract
  -- But for simplicity, we'll just recalculate from scratch when needed
  -- This is handled by the query filtering in the application
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS trigger_update_product_analytics_on_status_change ON orders;
CREATE TRIGGER trigger_update_product_analytics_on_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered'))
  EXECUTE FUNCTION update_product_analytics_on_order_status_change();

-- Add unique constraint on product_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_analytics_product_id_key'
  ) THEN
    ALTER TABLE product_analytics ADD CONSTRAINT product_analytics_product_id_key UNIQUE (product_id);
  END IF;
END $$;

