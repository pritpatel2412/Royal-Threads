-- Create analytics tables for better performance
-- This migration creates order_analytics and product_analytics tables

-- Order Analytics Table
CREATE TABLE IF NOT EXISTS order_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  shipped_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  cancellation_fees DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Analytics Table
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  total_quantity_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  times_ordered INTEGER DEFAULT 0,
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_analytics_date ON order_analytics(order_date);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_revenue ON product_analytics(total_revenue DESC);

-- Enable RLS
ALTER TABLE order_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_analytics
CREATE POLICY "Anyone can read order analytics" ON order_analytics
FOR SELECT USING (true);

-- RLS Policies for product_analytics
CREATE POLICY "Anyone can read product analytics" ON product_analytics
FOR SELECT USING (true);

-- Function to update order analytics
CREATE OR REPLACE FUNCTION update_order_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert order analytics for the order date
  INSERT INTO order_analytics (order_date, total_orders, completed_orders, pending_orders, cancelled_orders, shipped_orders, total_revenue, cancellation_fees)
  VALUES (
    DATE(NEW.created_at),
    1,
    CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'shipped' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'delivered' THEN NEW.total_amount ELSE 0 END,
    CASE WHEN NEW.status = 'cancelled' THEN COALESCE(NEW.cancellation_fee, 0) ELSE 0 END
  )
  ON CONFLICT (order_date) DO UPDATE SET
    total_orders = order_analytics.total_orders + 1,
    completed_orders = order_analytics.completed_orders + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
    pending_orders = order_analytics.pending_orders + CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
    cancelled_orders = order_analytics.cancelled_orders + CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    shipped_orders = order_analytics.shipped_orders + CASE WHEN NEW.status = 'shipped' THEN 1 ELSE 0 END,
    total_revenue = order_analytics.total_revenue + CASE WHEN NEW.status = 'delivered' THEN NEW.total_amount ELSE 0 END,
    cancellation_fees = order_analytics.cancellation_fees + CASE WHEN NEW.status = 'cancelled' THEN COALESCE(NEW.cancellation_fee, 0) ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order analytics
DROP TRIGGER IF EXISTS trigger_update_order_analytics ON orders;
CREATE TRIGGER trigger_update_order_analytics
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_analytics();

-- Function to update product analytics
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product analytics for each order item
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product analytics
DROP TRIGGER IF EXISTS trigger_update_product_analytics ON order_items;
CREATE TRIGGER trigger_update_product_analytics
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics();

-- Add unique constraint for order_analytics
ALTER TABLE order_analytics ADD CONSTRAINT unique_order_date UNIQUE (order_date);
