
-- Insert sample categories first
INSERT INTO public.categories (id, name, slug, description, is_active, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sherwanis', 'sherwanis', 'Traditional Indian wedding wear for grooms', true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Indo-Western', 'indo-western', 'Modern fusion wear combining traditional and contemporary styles', true, 2),
('550e8400-e29b-41d4-a716-446655440003', 'Accessories', 'accessories', 'Wedding accessories and complementary items', true, 3);

-- Insert sample products
INSERT INTO public.products (
  id, name, slug, description, short_description, price, compare_price, 
  sku, category_id, is_featured, status, stock_quantity
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440011',
  'Royal Maroon Sherwani',
  'royal-maroon-sherwani',
  'Exquisite maroon sherwani crafted with premium silk and intricate golden embroidery. Perfect for wedding ceremonies and special occasions.',
  'Premium silk sherwani with golden embroidery',
  45000,
  55000,
  'RMS001',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  'active',
  15
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Classic Cream Sherwani',
  'classic-cream-sherwani',
  'Elegant cream colored sherwani with subtle silver work. Timeless design that complements any wedding theme.',
  'Classic cream sherwani with silver detailing',
  38000,
  48000,
  'CCS002',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  'active',
  12
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Designer Navy Blue Indo-Western',
  'designer-navy-blue-indo-western',
  'Contemporary navy blue indo-western outfit perfect for modern grooms who want to blend tradition with style.',
  'Modern navy blue indo-western suit',
  32000,
  40000,
  'DNB003',
  '550e8400-e29b-41d4-a716-446655440002',
  true,
  'active',
  18
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'Golden Silk Sherwani',
  'golden-silk-sherwani',
  'Luxurious golden silk sherwani with intricate thread work and premium finishing. A statement piece for your special day.',
  'Luxurious golden silk with thread work',
  52000,
  62000,
  'GSS004',
  '550e8400-e29b-41d4-a716-446655440001',
  false,
  'active',
  8
),
(
  '550e8400-e29b-41d4-a716-446655440015',
  'Black Velvet Indo-Western',
  'black-velvet-indo-western',
  'Sophisticated black velvet indo-western with contemporary cut and traditional elements.',
  'Sophisticated black velvet design',
  35000,
  null,
  'BVI005',
  '550e8400-e29b-41d4-a716-446655440002',
  false,
  'active',
  10
),
(
  '550e8400-e29b-41d4-a716-446655440016',
  'Burgundy Wedding Sherwani',
  'burgundy-wedding-sherwani',
  'Rich burgundy sherwani with gold accents, perfect for traditional wedding ceremonies.',
  'Rich burgundy with gold accents',
  42000,
  50000,
  'BWS006',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  'active',
  14
);
