// Utility for handling product images from local folder and Supabase storage
export const getProductImageUrl = (imageName: string) => {
  return `/images/products/${imageName}`;
};

// Function to sanitize product name for file matching
export const sanitizeProductName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-_.]/g, '') // remove special characters
    .trim()
    .replace(/\s+/g, '-'); // spaces to dashes
};

// Function to find images with naming convention like product-name_1.jpg, product-name_2.jpg, or product-name-1.jpg, product-name-2.jpg
export const findProductImagesWithSuffix = (productName: string): string[] => {
  const sanitizedName = sanitizeProductName(productName);
  const images: string[] = [];
  
  // Available image files (same as in findProductImages) - includes variant images
  const availableImages = [
    'sherwani.JPG',
    'Emerald Green Sherwani.jpg',
    'Peacock Blue Sherwani.JPG',
    'Peacock Blue Sherwani_1.JPG',
    'jodhpuri.jpg',
    'indo-western.JPG',
    'Royal Blue Bandhgala.webp',
    'Royal Blue Bandhgala_1.webp',
    'Royal Blue Bandhgala_2.webp',
    'Royal Blue Bandhgala_3.webp',
    'Classic Bandhgala.webp',
    'Classic Bandhgala-1.webp',
    'Classic Bandhgala-2.webp',
    'Ivory Pearl Sherwani.webp',
    'Ivory Pearl Sherwani_1.webp',
    'Royal Maroon Sherwani.jpg',
    'Royal Maroon Sherwani_1.jpg',
    'leather wedding mojaris.jpg',
    'leather wedding mojaris.webp',
    'Legacy Brand.jpg',
    'happy client 1.jpeg',
    'happy client 2.jpg',
    'happy client 3.jpg',
    'happy client 4.jpeg',
    'happy client 5.jpg',
    'happy client 6.webp',
    'rohit-anniversary.jpg',
    '550e8400-e29b-41d4-a716-446655440011.jpg',
    '550e8400-e29b-41d4-a716-446655440011-1.jpg',
    '550e8400-e29b-41d4-a716-446655440011-2.jpg',
    '550e8400-e29b-41d4-a716-446655440011-3.jpg',
    '550e8400-e29b-41d4-a716-446655440011-4.jpg',
    '550e8400-e29b-41d4-a716-446655440011-5.jpg',
    '550e8400-e29b-41d4-a716-446655440021.jpg',
    '550e8400-e29b-41d4-a716-446655440021-1.jpg',
    '550e8400-e29b-41d4-a716-446655440021-2.jpg',
    '550e8400-e29b-41d4-a716-446655440024.jpg',
    '550e8400-e29b-41d4-a716-446655440025.jpg',
    '550e8400-e29b-41d4-a716-446655440025-1.jpg',
    '550e8400-e29b-41d4-a716-446655440025-2.jpg',
    '_17A0158.JPG',
    '_DSC2712.jpg',
    'Gemini_Generated_Image_doo59sdoo59sdoo5.png',
    'Royal Threads.png',
    'Wine Velvet Indo-Western.webp'
  ];
  
  // Try to find images with _1, _2, _3, etc. suffixes (underscore) - case insensitive
  const extensions = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'webp', 'WEBP', 'avif', 'AVIF'];
  
  // First try to find the base image (without suffix) - case insensitive
  for (const ext of extensions) {
    const baseImage = `${sanitizedName}.${ext}`;
    const foundImage = availableImages.find(img => img.toLowerCase() === baseImage.toLowerCase());
    if (foundImage && !images.includes(foundImage)) {
      images.push(foundImage);
    }
  }
  
  // Then try to find images with _1, _2, _3 suffixes (underscore) - case insensitive
  for (let i = 1; i <= 10; i++) {
    for (const ext of extensions) {
      const suffixedImage = `${sanitizedName}_${i}.${ext}`;
      const foundImage = availableImages.find(img => img.toLowerCase() === suffixedImage.toLowerCase());
      if (foundImage && !images.includes(foundImage)) {
        images.push(foundImage);
      }
    }
  }
  
  // Also try to find images with -1, -2, -3 suffixes (dash) - for naming like Classic Bandhgala-1.webp - case insensitive
  for (let i = 1; i <= 10; i++) {
    for (const ext of extensions) {
      const dashedImage = `${sanitizedName}-${i}.${ext}`;
      const foundImage = availableImages.find(img => img.toLowerCase() === dashedImage.toLowerCase());
      if (foundImage && !images.includes(foundImage)) {
        images.push(foundImage);
      }
    }
  }
  
  return images;
};

// Function to find all images for a product by name
export const findProductImages = (productName: string): string[] => {
  const sanitizedName = sanitizeProductName(productName);
  const images: string[] = [];
  
  // Available image files (you can expand this list) - includes variant images
  const availableImages = [
    'sherwani.JPG',
    'Emerald Green Sherwani.jpg',
    'Peacock Blue Sherwani.JPG',
    'Peacock Blue Sherwani_1.JPG',
    'jodhpuri.jpg',
    'indo-western.JPG',
    'Royal Blue Bandhgala.webp',
    'Royal Blue Bandhgala_1.webp',
    'Royal Blue Bandhgala_2.webp',
    'Royal Blue Bandhgala_3.webp',
    'Classic Bandhgala.webp',
    'Classic Bandhgala-1.webp',
    'Classic Bandhgala-2.webp',
    'Ivory Pearl Sherwani.webp',
    'Ivory Pearl Sherwani_1.webp',
    'Royal Maroon Sherwani.jpg',
    'Royal Maroon Sherwani_1.jpg',
    'leather wedding mojaris.jpg',
    'leather wedding mojaris.webp',
    'Legacy Brand.jpg',
    'happy client 1.jpeg',
    'happy client 2.jpg',
    'happy client 3.jpg',
    'happy client 4.jpeg',
    'happy client 5.jpg',
    'happy client 6.webp',
    'rohit-anniversary.jpg',
    '550e8400-e29b-41d4-a716-446655440011.jpg',
    '550e8400-e29b-41d4-a716-446655440011-1.jpg',
    '550e8400-e29b-41d4-a716-446655440011-2.jpg',
    '550e8400-e29b-41d4-a716-446655440011-3.jpg',
    '550e8400-e29b-41d4-a716-446655440011-4.jpg',
    '550e8400-e29b-41d4-a716-446655440011-5.jpg',
    '550e8400-e29b-41d4-a716-446655440021.jpg',
    '550e8400-e29b-41d4-a716-446655440021-1.jpg',
    '550e8400-e29b-41d4-a716-446655440021-2.jpg',
    '550e8400-e29b-41d4-a716-446655440024.jpg',
    '550e8400-e29b-41d4-a716-446655440025.jpg',
    '550e8400-e29b-41d4-a716-446655440025-1.jpg',
    '550e8400-e29b-41d4-a716-446655440025-2.jpg',
    '_17A0158.JPG',
    '_DSC2712.jpg',
    'Gemini_Generated_Image_doo59sdoo59sdoo5.png',
    'Royal Threads.png',
    'Wine Velvet Indo-Western.webp'
  ];

  // First, try to find exact matches or partial matches
  const matchedImages = availableImages.filter(img => {
    const imgLower = img.toLowerCase();
    const nameLower = productName.toLowerCase();
    
    // Check if product name contains in image name or vice versa
    return imgLower.includes(nameLower) || 
           nameLower.includes(imgLower.replace(/\.(jpg|jpeg|png|webp)$/i, '')) ||
           imgLower.includes(sanitizedName) ||
           sanitizedName.includes(imgLower.replace(/\.(jpg|jpeg|png|webp)$/i, ''));
  });

  // If we found matches, return them
  if (matchedImages.length > 0) {
    return matchedImages;
  }

  // If no direct matches, try to find images with similar names
  const words = productName.toLowerCase().split(/\s+/);
  const similarImages = availableImages.filter(img => {
    const imgLower = img.toLowerCase();
    return words.some(word => imgLower.includes(word));
  });

  return similarImages.length > 0 ? similarImages : ['placeholder.svg'];
};

// Map product names to actual image files (fallback for specific mappings)
export const productImageMap: Record<string, string> = {
  // Sherwanis
  'Burgundy Wedding Sherwani': 'Burgundy Wedding Sherwani.avif',
  'Classic Cream Sherwani': 'Classic Cream Sherwani.avif',
  'Royal Maroon Sherwani': 'Royal Maroon Sherwani.jpg',
  'Emerald Green Sherwani': 'Emerald Green Sherwani.avif',
  'Peacock Blue Silk Sherwani': 'Peacock Blue Sherwani.JPG',
  'Ivory Pearl Sherwani': 'Ivory Pearl Sherwani.webp',
  'Golden Silk Sherwani': 'Golden Silk Sherwani.webp',
  'Peacock Blue Sherwani': 'Peacock Blue Sherwani.JPG',
  
  // Jodhpuri
  'Classic Jodhpuri Suit': 'jodhpuri.jpg',
  'Royal Blue Jodhpuri': 'jodhpuri.jpg',
  'Cream Jodhpuri': 'jodhpuri.jpg',
  
  // Indo-Western
  'Indo-Western Fusion': 'indo-western.JPG',
  'Modern Indo-Western': 'indo-western.JPG',
  'Contemporary Fusion': 'indo-western.JPG',
  'Charcoal Grey Indo-Western': 'Charcoal Grey Indo-Western.webp',
  'Black Velvet Indo-Western': 'Black Velvet Indo-Western.webp',
  'Mint Green Indo-Western': 'Mint Green Indo-Western.webp',
  'Designer Navy Blue Indo-Western':'Designer Navy Blue Indo-Western.webp',
  'Wine Velvet Indo-Western':'Wine Velvet Indo-Western.webp',
  // Bandhgala
  'Royal Blue Bandhgala': 'Royal Blue Bandhgala.webp',

  'Classic Bandhgala': 'Classic Bandhgala.webp',
  
  // Accessories
  'Leather Wedding Mojaris': 'leather wedding mojaris.jpg',
  'Royal Wedding Mojaris': 'leather wedding mojaris.webp',
  'Gold Silk Nehru Jacket': 'Gold Silk Nehru Jacket.avif',
  'Silver Embroidered Stole': 'Silver Embroidered Stole.webp',
  
  // Legacy Brand
  'Legacy Collection': 'Legacy Brand.jpg',
  'Royal Legacy': 'Legacy Brand.jpg',
  
  // Client Photos
  'Happy Client 1': 'happy client 1.jpeg',
  'Happy Client 2': 'happy client 2.jpg',
  'Happy Client 3': 'happy client 3.jpg',
  'Happy Client 4': 'happy client 4.jpeg',
  'Happy Client 5': 'happy client 5.jpg',
  'Happy Client 6': 'happy client 6.webp',
  'Rohit Anniversary': 'rohit-anniversary.jpg',
  
  // Product variations
  '550e8400-e29b-41d4-a716-446655440011': '550e8400-e29b-41d4-a716-446655440011.jpg',
  '550e8400-e29b-41d4-a716-446655440021': '550e8400-e29b-41d4-a716-446655440021.jpg',
  '550e8400-e29b-41d4-a716-446655440024': '550e8400-e29b-41d4-a716-446655440024.jpg',
  '550e8400-e29b-41d4-a716-446655440025': '550e8400-e29b-41d4-a716-446655440025.jpg',
  '550e8400-e29b-41d4-a716-446655440023': '550e8400-e29b-41d4-a716-446655440023.jpg',
  '_17A0158': '_17A0158.JPG',
  '_DSC2712': '_DSC2712.jpg',
  'Gemini_Generated_Image': 'Gemini_Generated_Image_doo59sdoo59sdoo5.png',
  'Royal Threads': 'Royal Threads.png'
};

// Default product images that you can place in public/images/products/
export const defaultProductImages = [
  'sherwani.JPG',
  'Emerald Green Sherwani.jpg', 
  'Peacock Blue Sherwani.JPG',
  'jodhpuri.jpg',
  'indo-western.JPG',
  'Royal Blue Bandhgala.webp',
  'leather wedding mojaris.jpg',
  'Legacy Brand.jpg'
];

// Get primary image for product (for shop page)
export const getProductImage = (product: any, index: number = 0) => {
  // If product has uploaded images in database (Supabase storage), use those
  if (product.product_images && product.product_images.length > 0) {
    const primaryImage = product.product_images.find((img: any) => img.is_primary) || product.product_images[0];
    return {
      url: primaryImage.image_url,
      alt: primaryImage.alt_text || product.name
    };
  }
  
  // Try to find image by product name
  const productName = product.name || '';
  
  // First try exact mapping
  const mappedImage = productImageMap[productName];
  if (mappedImage) {
    return {
      url: getProductImageUrl(mappedImage),
      alt: product.name
    };
  }
  
  // Then try dynamic search
  const foundImages = findProductImages(productName);
  if (foundImages.length > 0) {
    return {
      url: getProductImageUrl(foundImages[0]), // Use first image as primary
      alt: product.name
    };
  }
  
  // Try to find image by product ID
  const productId = product.id || '';
  const mappedImageById = productImageMap[productId];
  
  if (mappedImageById) {
    return {
      url: getProductImageUrl(mappedImageById),
      alt: product.name
    };
  }
  
  // Otherwise use local images from folder by index
  const imageName = defaultProductImages[index % defaultProductImages.length];
  return {
    url: getProductImageUrl(imageName),
    alt: product.name
  };
};

// Get all images for a product (for product detail page)
export const getProductImages = (product: any) => {
  // If product has uploaded images in database (Supabase storage), use those
  if (product.product_images && product.product_images.length > 0) {
    return product.product_images
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((img: any) => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || product.name,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      }));
  }
  
  // Try to find all images by product name
  const productName = product.name || '';
  
  // PRIORITY 1: Try exact mapping first (most reliable)
  const mappedImage = productImageMap[productName];
  if (mappedImage) {
    // Check if mapped image has variants (with _1, _2, _3 suffixes or -1, -2, -3 suffixes)
    const baseName = mappedImage.replace(/\.(JPG|jpg|jpeg|png|webp|avif)$/i, '');
    const variants: string[] = [mappedImage];
    
    // AUTOMATIC VARIANT DETECTION: Find all related images by base name
    // This automatically links any new images added with the same base name
    const extensions = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'webp', 'WEBP', 'avif', 'AVIF'];
    
    // Available images list - includes all variant images
    // Note: This list should be dynamically generated from actual files, but for now we maintain it
    const availableImages = [
      'sherwani.JPG',
      'Emerald Green Sherwani.jpg',
      'Peacock Blue Sherwani.JPG',
      'Peacock Blue Sherwani_1.JPG',

      'jodhpuri.jpg',
      'indo-western.JPG',

      'Burgundy Wedding Sherwani.avif',
      'Burgundy Wedding Sherwani_1.avif',

      'Designer Navy Blue Indo-Western.webp',
      'Designer Navy Blue Indo-Western_1.avif',

      'Emerald Green Sherwani.avif',
      'Emerald Green Sherwani_1.avif',
      'Emerald Green Sherwani_2.avif',
      'Emerald Green Sherwani_3.avif',
      'Emerald Green Sherwani_4.avif',

      'Royal Blue Bandhgala.webp',
      'Royal Blue Bandhgala_1.webp',
      'Royal Blue Bandhgala_2.webp',
      'Royal Blue Bandhgala_3.webp',

      'Gold Silk Nehru Jacket.avif',
      'Gold Silk Nehru Jacket_1.avif',

      'Silver Embroidered Stole.webp',
      'Silver Embroidered Stole_1.avif',
      'Silver Embroidered Stole_2.avif',

      'Classic Cream Sherwani.avif',
      'Classic Cream Sherwani_1.avif',

      'Classic Bandhgala.webp',
      'Classic Bandhgala-1.webp',
      'Classic Bandhgala-2.webp',

      'Black Velvet Indo-Western.webp',
      'Black Velvet Indo-Western_1.webp',
      'Black Velvet Indo-Western_2.webp',
      'Black Velvet Indo-Western_3.webp',
      'Black Velvet Indo-Western_4.webp',
      'Black Velvet Indo-Western_5.webp',
      'Black Velvet Indo-Western_6.webp',

      'Ivory Pearl Sherwani.webp',
      'Ivory Pearl Sherwani_1.webp',
      'Ivory Pearl Sherwani_2.webp',
      'Ivory Pearl Sherwani_3.webp',
      'Ivory Pearl Sherwani_4.webp',
      'Ivory Pearl Sherwani_5.webp',

      'Royal Maroon Sherwani.jpg',
      'Royal Maroon Sherwani_1.jpg',

      'Golden Silk Sherwani.webp',
      'Golden Silk Sherwani_1.webp',
      'Golden Silk Sherwani_2.webp',
      'Golden Silk Sherwani_3.webp',
      'Golden Silk Sherwani_4.webp',

      'leather wedding mojaris.jpg',
      'leather wedding mojaris.webp',
      'Charcoal Grey Indo-Western.webp',
      'Charcoal Grey Indo-Western_1.webp',
      'Charcoal Grey Indo-Western_2.webp',
      'Charcoal Grey Indo-Western_3.webp',
      'Mint Green Indo-Western.webp',
      'Mint Green Indo-Western_1.webp',
      'Wine Velvet Indo-Western.webp',
      'Wine Velvet Indo-Western_1.webp',
      'Wine Velvet Indo-Western_2.webp',
      'Wine Velvet Indo-Western_3.webp',
      'Wine Velvet Indo-Western_4.webp',
      'Wine Velvet Indo-Western_5.webp',
      'Legacy Brand.jpg',
      'happy client 1.jpeg',
      'happy client 2.jpg',
      'happy client 3.jpg',
      'happy client 4.jpeg',
      'happy client 5.jpg',
      'happy client 6.webp',
      'rohit-anniversary.jpg',
      '550e8400-e29b-41d4-a716-446655440011.jpg',
      '550e8400-e29b-41d4-a716-446655440011-1.jpg',
      '550e8400-e29b-41d4-a716-446655440011-2.jpg',
      '550e8400-e29b-41d4-a716-446655440011-3.jpg',
      '550e8400-e29b-41d4-a716-446655440011-4.jpg',
      '550e8400-e29b-41d4-a716-446655440011-5.jpg',
      '550e8400-e29b-41d4-a716-446655440021.jpg',
      '550e8400-e29b-41d4-a716-446655440021-1.jpg',
      '550e8400-e29b-41d4-a716-446655440021-2.jpg',
      '550e8400-e29b-41d4-a716-446655440024.jpg',
      '550e8400-e29b-41d4-a716-446655440025.jpg',
      '550e8400-e29b-41d4-a716-446655440025-1.jpg',
      '550e8400-e29b-41d4-a716-446655440025-2.jpg',
      '_17A0158.JPG',
      '_DSC2712.jpg',
      'Gemini_Generated_Image_doo59sdoo59sdoo5.png',
      'Royal Threads.png',
      'Wine Velvet Indo-Western.webp'
    ];
    
    // AUTOMATIC VARIANT DETECTION: Search for all variants in available images
    // This automatically finds any images matching the base name pattern
    const baseNameLower = baseName.toLowerCase();
    
    // Find all images that start with the base name (case insensitive)
    const allRelatedImages = availableImages.filter(img => {
      const imgName = img.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '').toLowerCase();
      // Check if image matches base name exactly or with variants
      return imgName === baseNameLower || 
             imgName.startsWith(`${baseNameLower}_`) || 
             imgName.startsWith(`${baseNameLower}-`);
    });
    
    // Add all related images to variants (sorted by variant number)
    allRelatedImages.forEach(img => {
      if (!variants.includes(img)) {
        variants.push(img);
      }
    });
    
    // Sort variants: main image first, then variants in order (_1, _2, _3 or -1, -2, -3)
    variants.sort((a, b) => {
      // Main image always first
      if (a === mappedImage) return -1;
      if (b === mappedImage) return 1;
      
      // Extract variant numbers
      const getVariantNumber = (filename: string): number => {
        const match = filename.match(/[_-](\d+)\./i);
        return match ? parseInt(match[1], 10) : 999;
      };
      
      return getVariantNumber(a) - getVariantNumber(b);
    });
    
    // Also try explicit format matching for backward compatibility
    for (let i = 1; i <= 10; i++) {
      for (const ext of extensions) {
        // Underscore format
        const variantNameUnderscore = `${baseName}_${i}.${ext}`;
        const foundUnderscore = availableImages.find(img => 
          img.toLowerCase() === variantNameUnderscore.toLowerCase() && !variants.includes(img)
        );
        if (foundUnderscore) {
          variants.push(foundUnderscore);
        }
        
        // Dash format
        const variantNameDash = `${baseName}-${i}.${ext}`;
        const foundDash = availableImages.find(img => 
          img.toLowerCase() === variantNameDash.toLowerCase() && !variants.includes(img)
        );
        if (foundDash) {
          variants.push(foundDash);
        }
      }
    }
    
    return variants.map((imageName, index) => ({
      id: `mapped-${index}`,
      image_url: getProductImageUrl(imageName),
      alt_text: index === 0 ? product.name : `${product.name} view ${index + 1}`,
      is_primary: index === 0,
      sort_order: index
    }));
  }
  
  // PRIORITY 2: Try to find images with suffix naming convention (_1, _2, _3)
  const suffixedImages = findProductImagesWithSuffix(productName);
  if (suffixedImages.length > 0) {
    return suffixedImages.map((imageName, index) => ({
      id: `local-${index}`,
      image_url: getProductImageUrl(imageName),
      alt_text: `${product.name} view ${index + 1}`,
      is_primary: index === 0,
      sort_order: index
    }));
  }
  
  // PRIORITY 3: Try general image search
  const foundImages = findProductImages(productName);
  if (foundImages.length > 0) {
    return foundImages.map((imageName, index) => ({
      id: `local-${index}`,
      image_url: getProductImageUrl(imageName),
      alt_text: `${product.name} view ${index + 1}`,
      is_primary: index === 0,
      sort_order: index
    }));
  }
  
  // PRIORITY 4: Fallback to default images
  return defaultProductImages.map((imageName, index) => ({
    id: `local-${index}`,
    image_url: getProductImageUrl(imageName),
    alt_text: `${product.name} view ${index + 1}`,
    is_primary: index === 0,
    sort_order: index
  }));
};
