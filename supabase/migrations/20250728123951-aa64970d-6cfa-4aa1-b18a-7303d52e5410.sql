
-- Create tables for comprehensive product management
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some default categories
INSERT INTO public.product_categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and gardening items'),
('Sports', 'Sports equipment and accessories')
ON CONFLICT DO NOTHING;

-- Create admin-specific tables for managing products
CREATE TABLE IF NOT EXISTS public.admin_product_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  last_modified_by UUID REFERENCES public.admin_users(id),
  action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deactivated'
  changes_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order status tracking table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.admin_users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_product_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product categories (public read access)
CREATE POLICY "Public can view active categories" ON public.product_categories
  FOR SELECT USING (is_active = true);

-- Create RLS policies for admin product management (admin only)
CREATE POLICY "Admins can manage product logs" ON public.admin_product_management
  FOR ALL USING (true);

-- Create RLS policies for order status history (admin only)
CREATE POLICY "Admins can manage order status history" ON public.order_status_history
  FOR ALL USING (true);

-- Update products table to allow admin modifications
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (status = 'active'::product_status);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (true);

-- Update product_images table to allow admin modifications
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage product images" ON public.product_images
  FOR ALL USING (true);

-- Update product_variants table to allow admin modifications
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage product variants" ON public.product_variants
  FOR ALL USING (true);

-- Update orders table to allow admin modifications
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (true);

-- Update order_items table to allow admin access
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
