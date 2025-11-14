# Product Images Organization Guide

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
burgundy-wedding-sherwani.jpg
burgundy-wedding-sherwani_1.jpg
burgundy-wedding-sherwani_2.jpg
burgundy-wedding-sherwani_3.jpg

classic-cream-sherwani.jpg
classic-cream-sherwani_1.jpg
classic-cream-sherwani_2.jpg
```

### Jodhpuri Products
```
royal-blue-jodhpuri.jpg
royal-blue-jodhpuri_1.jpg
royal-blue-jodhpuri_2.jpg

cream-jodhpuri.jpg
cream-jodhpuri_1.jpg
```

### Indo-Western Products
```
charcoal-grey-indo-western.jpg
charcoal-grey-indo-western_1.jpg
charcoal-grey-indo-western_2.jpg
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

- Use **lowercase** and **hyphens** instead of spaces
- Remove special characters from image names
- Keep main image without suffix for shop page
- Add _1, _2, _3 for additional views in product detail page
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`

## 🔍 Current Available Images

The system currently recognizes these images:
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
