# Admin Image Upload Guide

## 🎯 Overview
This guide explains how to upload product images from the admin panel that will automatically reflect on the user side.

## 📋 Prerequisites

### 1. Supabase Storage Bucket Setup
Make sure you have a storage bucket named `product-images` in your Supabase project:

```sql
-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);
```

### 2. Storage Policies
Set up proper storage policies for the bucket:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## 🔧 How It Works

### 1. **Image Upload Process**
- Admin uploads images through the admin panel
- Images are stored in Supabase storage bucket
- Image URLs are saved in `product_images` table
- User side automatically fetches these images

### 2. **Database Schema**
```sql
-- Product images table
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **Image Priority System**
1. **Supabase Storage Images** (Highest Priority)
   - Images uploaded through admin panel
   - Stored in `product_images` table
   - Automatically displayed on user side

2. **Local Images** (Fallback)
   - Images stored in `public/images/products/`
   - Used when no Supabase images are available
   - Named according to product names

## 📝 Step-by-Step Guide

### **Step 1: Access Admin Panel**
1. Go to `/admin` route
2. Login with admin credentials
3. Navigate to "Product Management"

### **Step 2: Create New Product**
1. Click "Add New Product"
2. Fill in product details:
   - Name
   - Description
   - Price
   - Category
   - Stock quantity

### **Step 3: Upload Images**
1. In the "Product Images" section, click "Upload Images"
2. Select multiple images (up to 5)
3. Images will be uploaded to Supabase storage
4. First image becomes the primary image

### **Step 4: Save Product**
1. Click "Create Product"
2. Product and images are saved to database
3. Images automatically appear on user side

## 🎨 Image Requirements

### **Supported Formats**
- JPG/JPEG
- PNG
- WebP

### **Recommended Specifications**
- **Resolution**: 800x800px minimum
- **File Size**: Under 5MB per image
- **Aspect Ratio**: Square (1:1) for best results
- **Quality**: High quality, well-lit images

### **Naming Convention**
- Use descriptive names
- Avoid special characters
- Keep names short and clear

## 🔄 Update Existing Products

### **Add Images to Existing Product**
1. Find the product in admin panel
2. Click "Edit" button
3. Upload new images in "Product Images" section
4. Save changes

### **Replace Images**
1. Edit the product
2. Remove existing images (click X button)
3. Upload new images
4. Save changes

## 🚀 User Side Integration

### **Automatic Display**
- Images uploaded through admin panel automatically appear on:
  - Shop page (primary image)
  - Product detail page (all images)
  - Trending products section
  - Related products section

### **Fallback System**
- If no Supabase images are available, system falls back to local images
- Local images are found by product name matching
- Placeholder image is shown if no images are found

## 🛠️ Technical Details

### **Storage Structure**
```
product-images/
├── product-id-1/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── image3.jpg
├── product-id-2/
│   ├── image1.jpg
│   └── image2.jpg
└── temp/
    └── temporary-uploads/
```

### **Image Processing**
- Images are automatically optimized
- Public URLs are generated
- Metadata is stored in database
- Automatic cleanup of temporary files

## 🔍 Troubleshooting

### **Common Issues**

1. **Images Not Appearing**
   - Check storage bucket permissions
   - Verify image URLs in database
   - Check browser console for errors

2. **Upload Failures**
   - Check file size (max 5MB)
   - Verify file format
   - Check network connection

3. **Permission Errors**
   - Ensure admin is authenticated
   - Check storage policies
   - Verify bucket exists

### **Debug Steps**
1. Check Supabase storage dashboard
2. Verify `product_images` table entries
3. Test image URLs directly
4. Check browser network tab

## 📊 Best Practices

### **Image Management**
- Use consistent aspect ratios
- Optimize images before upload
- Use descriptive alt text
- Keep file sizes reasonable

### **Organization**
- Group related images together
- Use clear naming conventions
- Regular cleanup of unused images
- Backup important images

### **Performance**
- Compress images appropriately
- Use WebP format when possible
- Implement lazy loading
- Cache images effectively

## 🎯 Success Indicators

✅ **Admin Side**
- Images upload successfully
- Preview shows correctly
- Database entries created
- No error messages

✅ **User Side**
- Images appear immediately
- All image views work
- Thumbnails display correctly
- No broken image links

## 🔄 Real-time Updates

The system automatically:
- Updates user side when admin uploads images
- Invalidates relevant queries
- Refreshes product displays
- Maintains consistency across all pages
