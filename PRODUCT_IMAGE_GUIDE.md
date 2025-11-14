# Product Image Organization Guide

## 📁 Image Storage Location
All product images should be stored in: `public/images/products/`

## 🏷️ Naming Convention

### For Single Product Images
```
product-name.jpg
product-name.png
product-name.webp
```

### For Multiple Images of Same Product
```
product-name.jpg      (main/primary image)
product-name_1.jpg    (second view)
product-name_2.jpg    (third view)
product-name_3.jpg    (fourth view)
```

## 📝 Examples

### Sherwani Products
```
Royal Maroon Sherwani.jpg
Royal Maroon Sherwani_1.jpg
Royal Maroon Sherwani_2.jpg
Royal Maroon Sherwani_3.jpg

Burgundy Wedding Sherwani.jpg
Burgundy Wedding Sherwani_1.jpg
Burgundy Wedding Sherwani_2.jpg

Classic Cream Sherwani.jpg
Classic Cream Sherwani_1.jpg
```

### Jodhpuri Products
```
Royal Blue Jodhpuri.jpg
Royal Blue Jodhpuri_1.jpg
Royal Blue Jodhpuri_2.jpg

Cream Jodhpuri.jpg
Cream Jodhpuri_1.jpg
```

### Indo-Western Products
```
Charcoal Grey Indo-Western.jpg
Charcoal Grey Indo-Western_1.jpg
Charcoal Grey Indo-Western_2.jpg

Modern Indo-Western.jpg
Modern Indo-Western_1.jpg
```

## 🔧 How It Works

1. **Shop Page**: Shows the main image (without suffix) for each product
2. **Product Detail Page**: Shows all images (_1, _2, _3, etc.) as thumbnails
3. **Automatic Mapping**: System automatically finds images based on product name

## 📋 Steps to Add New Product Images

1. **Rename your images** using the convention above
2. **Place them** in `public/images/products/` folder
3. **Update product name** in database to match image name
4. **System will automatically** find and display the images

## 🎯 Tips

- Use **exact product names** from database
- Keep **spaces** in image names (don't convert to hyphens)
- Remove special characters from image names
- Keep main image without suffix for shop page
- Add _1, _2, _3 for additional views in product detail page
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`

## 🔍 Current Available Images

The system currently recognizes these images:
- Royal Maroon Sherwani.jpg
- Royal Maroon Sherwani_1.jpg
- sherwani.JPG
- Emerald Green Sherwani.jpg
- Peacock blue silk sherwani.JPG
- jodhpuri.jpg
- indo-western.JPG
- Royal Blue Bandhgala.webp
- leather wedding mojaris.jpg
- Legacy Brand.jpg
- And many more...

## 🚀 Adding New Images

When you add new images with the naming convention:
1. The system will automatically detect them
2. Shop page will show the main image
3. Product detail page will show all related images
4. No code changes needed!

## 📊 Example Mapping

| Product Name in Database | Image Files | Result |
|-------------------------|-------------|---------|
| "Royal Maroon Sherwani" | Royal Maroon Sherwani.jpg<br>Royal Maroon Sherwani_1.jpg | ✅ Perfect match |
| "Burgundy Wedding Sherwani" | Burgundy Wedding Sherwani.jpg<br>Burgundy Wedding Sherwani_1.jpg | ✅ Perfect match |
| "Classic Cream Sherwani" | Classic Cream Sherwani.jpg | ✅ Single image |

## ⚠️ Important Notes

- **Case Sensitive**: Image names should match product names exactly
- **Spaces**: Keep spaces in image names, don't convert to hyphens
- **Special Characters**: Remove special characters from image names
- **Extensions**: Use .jpg, .jpeg, .png, or .webp
- **Order**: Main image first, then _1, _2, _3, etc.

## 🔄 System Priority

1. **Exact Match**: Product name exactly matches image name
2. **Suffix Search**: Looks for _1, _2, _3 variations
3. **Partial Match**: Finds similar names
4. **Fallback**: Uses default images
