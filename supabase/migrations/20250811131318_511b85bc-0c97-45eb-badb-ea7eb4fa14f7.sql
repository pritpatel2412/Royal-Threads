
-- Create a table for custom product tags
CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- hex color for the tag
  text_color VARCHAR(7) NOT NULL DEFAULT '#ffffff', -- text color for contrast
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a junction table for product-tag relationships
CREATE TABLE public.product_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Add foreign key constraints
ALTER TABLE public.product_tag_assignments 
ADD CONSTRAINT fk_product_tag_assignments_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_tag_assignments 
ADD CONSTRAINT fk_product_tag_assignments_tag 
FOREIGN KEY (tag_id) REFERENCES public.product_tags(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_tags
CREATE POLICY "Public can view active tags" 
  ON public.product_tags 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage tags" 
  ON public.product_tags 
  FOR ALL 
  USING (true);

-- RLS policies for product_tag_assignments
CREATE POLICY "Public can view tag assignments" 
  ON public.product_tag_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage tag assignments" 
  ON public.product_tag_assignments 
  FOR ALL 
  USING (true);

-- Insert some default tags
INSERT INTO public.product_tags (name, color, text_color, sort_order) VALUES
('Featured', '#fbbf24', '#92400e', 1),
('Sale', '#ef4444', '#ffffff', 2),
('New Arrival', '#10b981', '#ffffff', 3),
('Demanding', '#f59e0b', '#ffffff', 4),
('Limited Edition', '#8b5cf6', '#ffffff', 5),
('Best Seller', '#dc2626', '#ffffff', 6),
('Premium', '#1f2937', '#ffffff', 7);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_tags_updated_at
  BEFORE UPDATE ON public.product_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_product_tags_updated_at();
