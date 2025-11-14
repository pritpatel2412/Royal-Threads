import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import {
  Star,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import WishlistButton from '@/components/WishlistButton';
import AddToCartButton from '@/components/AddToCartButton';
import ProductTags from '@/components/ProductTags';
import { getProductImage, getProductImages } from '@/utils/productImages';

/**
 * ProductDetail.jsx
 *
 * - Loads product details from DB via useProduct(id)
 * - Loads images from public/images/products/ (local) using multiple heuristics:
 *   1) If product.product_images array contains file-like names, use them.
 *   2) else try {product.id}.jpg / .jpeg / .png / .webp
 *   3) else try sanitized product.name as filename
 * - Falls back to /images/products/placeholder.jpg when an image fails to load
 *
 * Place your local images in:
 *   public/images/products/
 * Example:
 *   public/images/products/550e8400-e29b-41d4-a716-446655440011.jpg
 *   public/images/products/royal-maroon-sherwani.jpg
 *   public/images/products/placeholder.jpg
 *
 * Notes:
 * - This component keeps prices, descriptions, and other data from DB,
 *   while forcing images to be resolved locally.
 */

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp','avif'];

function sanitizeFileName(name = '') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-_.]/g, '') // remove weird chars
    .trim()
    .replace(/\s+/g, '-'); // spaces -> dashes
}

/**
 * Try to build a list of local image candidates for the given product.
 * Returns array of image objects: { id, file_name, alt_text, is_primary (bool) }
 */
function buildLocalImages(product) {
  if (!product) return [];

  const images: Array<{ id?: string; file_name: string; alt_text?: string; is_primary?: boolean }> =
    [];

  // 1) If DB provided product_images and they look like local filenames, prefer those.
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    product.product_images.forEach((img, idx) => {
      // If entry looks like a simple filename or relative path (no http)
      const candidate =
        typeof img.image_url === 'string' && !/^https?:\/\//i.test(img.image_url)
          ? img.image_url
          : typeof img.file_name === 'string' && img.file_name
          ? img.file_name
          : null;

      if (candidate) {
        images.push({
          id: img.id || `${product.id}-img-${idx}`,
          file_name: candidate.replace(/^\/+/, ''), // remove leading slashes
          alt_text: img.alt_text || product.name,
          is_primary: Boolean(img.is_primary),
        });
      }
    });

    // If we found at least one candidate from product.product_images, return them (ordered)
    if (images.length > 0) {
      // ensure primary first
      const primary = images.find(i => i.is_primary);
      const rest = images.filter(i => !i.is_primary);
      return primary ? [primary, ...rest] : images;
    }
  }

  // 2) Try by product.id with common extensions
  // 2) Try by product.id with common extensions
for (let ext of IMAGE_EXTENSIONS) {
  images.push({
    file_name: `${product.id}.${ext}`,
    alt_text: product.name,
    is_primary: images.length === 0,
  });

  // Variant images: product.id-1, product.id-2, product.id-3
  for (let v = 1; v <= 5; v++) {
    images.push({
      file_name: `${product.id}-${v}.${ext}`,
      alt_text: `${product.name} ${v}`,
      is_primary: false,
    });
  }
}


  // 3) Try using sanitized name (helpful if you named images by product name)
  const safeName = sanitizeFileName(product.name || '');
  if (safeName) {
    for (let ext of IMAGE_EXTENSIONS) {
      images.push({
        file_name: `${safeName}.${ext}`,
        alt_text: product.name,
        is_primary: false,
      });
    }
  }

  // remove duplicates (keep first occurrence)
  const seen = new Set();
  const uniq = images.filter(imgObj => {
    if (seen.has(imgObj.file_name)) return false;
    seen.add(imgObj.file_name);
    return true;
  });

  return uniq;
}

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();

  // fetch product data (price, name, description, variants, tags, stock) from DB
  const { data: product, isLoading, error } = useProduct(id || '');
  
  // fetch all products for related products
  const { data: allProducts = [] } = useProducts();

  // build local images list with useMemo so it doesn't rebuild every render
  const localImages = useMemo(() => buildLocalImages(product), [product]);

  // map localImages to displayImages structure expected by UI
  const displayImages = useMemo(() => {
    if (!localImages || localImages.length === 0) {
      return [
        {
          id: 'placeholder',
          file_name: 'placeholder.svg',
          alt_text: product?.name || 'Product image',
        },
      ];
    }
    return localImages;
  }, [localImages, product]);

  // Use new image system for product detail page - prioritize exact mapping
  const productImages = useMemo(() => {
    if (!product) return [];
    
    // Use the new getProductImages function which uses exact mapping first
    const images = getProductImages(product);
    
    if (images.length > 0) {
      // Convert to the format expected by the UI
      return images.map((img, index) => ({
        id: img.id || `product-${index}`,
        file_name: img.image_url.replace('/images/products/', ''),
        alt_text: img.alt_text,
        is_primary: img.is_primary
      }));
    }
    
    // Fallback to buildLocalImages only if getProductImages doesn't find anything
    return [];
  }, [product]);

  // Get related products (same category, excluding current product)
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    
    // First try to find products from same category
    let related = allProducts.filter(p => 
      p.id !== product.id && // Exclude current product
      p.category_id === product.category_id && // Same category
      p.status === 'active' && // Only active products
      (p.stock_quantity || 0) > 0 // Only in stock products
    );
    
    // If not enough products from same category, add featured products
    if (related.length < 4) {
      const featuredProducts = allProducts.filter(p => 
        p.id !== product.id && // Exclude current product
        p.category_id !== product.category_id && // Different category
        p.is_featured && // Featured products
        p.status === 'active' && // Only active products
        (p.stock_quantity || 0) > 0 // Only in stock products
      );
      
      // Add featured products to fill up to 4
      related = [...related, ...featuredProducts.slice(0, 4 - related.length)];
    }
    
    return related.slice(0, 4); // Show max 4 related products
  }, [product, allProducts]);

  // loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Skeleton className="w-full h-96 lg:h-[600px] rounded-2xl mb-6" />
              <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // error / not found UI
  if (error || !product) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-royal-navy mb-4">Product Not Found</h1>
            <p className="text-xl text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // computed values
  const isOutOfStock = (product.stock_quantity || 0) === 0;
  const hasVariants = Array.isArray(product.product_variants) && product.product_variants.length > 0;
  const activeVariants = (product.product_variants || []).filter(v => v.is_active);
  const productTags = (product.product_tag_assignments || [])
    .map(a => a.product_tags)
    .filter(Boolean) || [];

  const currentPrice = selectedVariant
    ? product.price + (activeVariants.find(v => v.id === selectedVariant)?.price_adjustment || 0)
    : product.price;

  const handleWhatsAppOrder = () => {
    const selectedVariantText = selectedVariant
      ? ` - ${activeVariants.find(v => v.id === selectedVariant)?.name}: ${activeVariants.find(v => v.id === selectedVariant)?.value}`
      : '';
    const message = `Hello! I'm interested in "${product.name}"${selectedVariantText} (₹${currentPrice.toLocaleString()}). Please provide more details about availability and ordering.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = async () => {
    const productUrl = window.location.href;
    const shareText = `Check out this amazing ${product.name} - ${product.short_description || 'Premium quality product'} for ₹${currentPrice.toLocaleString()}`;
    
    // Check if Web Share API is available (mobile devices and modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Product link has been shared.",
        });
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          // Only show error if it's not a user cancellation
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({
          title: "Link copied!",
          description: "Product link has been copied to your clipboard.",
        });
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Link copied!",
            description: "Product link has been copied to your clipboard.",
          });
        } catch (err) {
          toast({
            title: "Unable to share",
            description: "Please copy the link manually from your browser.",
            variant: "destructive",
          });
        }
        document.body.removeChild(textArea);
      }
    }
  };

  // Prioritize productImages from getProductImages (exact mapping) over buildLocalImages
  const allImages = productImages.length > 0 ? productImages : displayImages;
  // safe index guard
  const safeIndex = Math.max(0, Math.min(selectedImage, allImages.length - 1));
  const mainImage = allImages[safeIndex] || displayImages[0];

  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="animate-fade-in">
            <div className="relative mb-6 group">
              {mainImage ? (
                <img
                  src={`/images/products/${mainImage.file_name}`}
                  alt={mainImage.alt_text || product.name}
                  className="w-full h-96 lg:h-[600px] object-cover rounded-2xl shadow-royal transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target;
                    // fallback to placeholder in public/images/products/placeholder.jpg
                    target.src = '/images/products/placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-96 lg:h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <ImageIcon className="w-24 h-24 text-gray-400" />
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <WishlistButton
                  productId={product.id}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm"
                />
                <Button 
                  variant="outline" 
                  size="default" 
                  className="bg-white/80 backdrop-blur-sm hover:bg-white"
                  onClick={handleShare}
                  aria-label="Share product"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Badge className="bg-red-500 text-white text-lg px-6 py-2">Sold Out</Badge>
                </div>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {(productImages.length > 0 ? productImages : displayImages).map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === index ? 'border-royal-navy shadow-lg scale-105' : 'border-gray-200 hover:border-royal-gold'
                  }`}
                >
                  <img
                    src={`/images/products/${image.file_name}`}
                    alt={image.alt_text || `${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/products/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <ProductTags tags={productTags} />
              {isOutOfStock && <Badge className="bg-red-100 text-red-800 font-medium">Sold Out</Badge>}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-500 ml-1">(4.8)</span>
              </div>
            </div>

            <h1 className="text-4xl font-serif font-bold text-royal-navy mb-4">{product.name}</h1>

            <p className="text-lg text-gray-500 mb-6">{product.categories?.name || 'Luxury Wedding Wear'}</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-royal-navy">₹{currentPrice.toLocaleString()}</span>
              {product.compare_price && product.compare_price > currentPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">₹{product.compare_price.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-800">Save ₹{(product.compare_price - currentPrice).toLocaleString()}</Badge>
                </>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{product.short_description}</p>
            )}
{/* 
            
            {hasVariants && activeVariants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select {activeVariants[0]?.name || 'Option'}</h3>
                <div className="flex gap-3 flex-wrap">
                  {activeVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      disabled={isOutOfStock || (variant.stock_quantity || 0) === 0}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                        selectedVariant === variant.id
                          ? 'border-royal-navy bg-royal-navy text-white'
                          : 'border-gray-300 text-gray-700 hover:border-royal-navy disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {variant.value}
                      {variant.price_adjustment && variant.price_adjustment !== 0 && (
                        <span className="ml-1 text-sm">({variant.price_adjustment > 0 ? '+' : ''}₹{variant.price_adjustment})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
*/}
            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <AddToCartButton
                productId={product.id}
                disabled={isOutOfStock}
                className="w-full bg-royal-navy hover:bg-royal-blue text-white font-semibold py-4 text-lg rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}
              </AddToCartButton>

              <Button
                onClick={handleWhatsAppOrder}
                variant="outline"
                disabled={isOutOfStock}
                className="w-full border-2 border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white font-semibold py-4 text-lg rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Order via WhatsApp
              </Button>
            </div>

            {/* Product Features */}
            <div className="bg-white rounded-2xl p-6 shadow-royal mb-8">
              <h3 className="text-xl font-serif font-bold text-royal-navy mb-4">Product Details</h3>

              {product.description && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-royal-ivory rounded-lg">
                  <Truck className="h-6 w-6 text-royal-navy mx-auto mb-2" />
                  <p className="text-sm font-medium text-royal-navy">Free Delivery</p>
                  <p className="text-xs text-gray-600">Pan India</p>
                </div>
                <div className="text-center p-4 bg-royal-ivory rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-royal-navy mx-auto mb-2" />
                  <p className="text-sm font-medium text-royal-navy">Quality Assured</p>
                  <p className="text-xs text-gray-600">Premium Materials</p>
                </div>
                <div className="text-center p-4 bg-royal-ivory rounded-lg">
                  <RotateCcw className="h-6 w-6 text-royal-navy mx-auto mb-2" />
                  <p className="text-sm font-medium text-royal-navy">Easy Returns</p>
                  <p className="text-xs text-gray-600">7 Day Policy</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-800">SKU:</span>
                    <span className="text-gray-600 ml-2">{product.sku}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Stock:</span>
                    <span className={`ml-2 ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                      {isOutOfStock ? 'Out of Stock' : `${product.stock_quantity} Available`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-royal-navy mb-4">
              Related <span className="text-gradient">Products</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {relatedProducts.some(p => p.category_id === product?.category_id) 
                ? `Discover more exquisite pieces from our ${product?.categories?.name || 'collection'} that you might love.`
                : "Discover more exquisite pieces from our collection that you might love."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => {
              const productImage = getProductImage(relatedProduct);
              const productTags = relatedProduct.product_tag_assignments?.map(assignment => assignment.product_tags).filter(Boolean) || [];
              
              return (
                <Card 
                  key={relatedProduct.id} 
                  className="group hover-scale shadow-royal transition-all duration-300"
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={productImage.url}
                        alt={productImage.alt}
                        className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/products/placeholder.svg';
                        }}
                      />
                      
                      {/* Product Tags */}
                      <div className="absolute top-4 left-4">
                        <ProductTags tags={productTags} />
                      </div>

                      {/* Wishlist Button */}
                      <div className="absolute top-4 right-4">
                        <WishlistButton 
                          productId={relatedProduct.id}
                          variant="ghost"
                          className="bg-white/80 backdrop-blur-sm hover:bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-2">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">
                          {relatedProduct.categories?.name || 'Wedding Wear'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-serif font-bold text-royal-navy mb-2 group-hover:text-royal-blue transition-colors duration-200 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      
                      {relatedProduct.short_description && (
                        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                          {relatedProduct.short_description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-royal-navy">
                            ₹{relatedProduct.price.toLocaleString()}
                          </span>
                          {relatedProduct.compare_price && relatedProduct.compare_price > relatedProduct.price && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{relatedProduct.compare_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <AddToCartButton
                          productId={relatedProduct.id}
                          className="w-full bg-royal-navy hover:bg-royal-blue text-white text-sm"
                        />
                        <Button 
                          asChild
                          variant="outline"
                          className="w-full border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white text-sm"
                        >
                          <Link to={`/product/${relatedProduct.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button 
              asChild
              variant="outline"
              className="border-2 border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white px-8 py-3 text-lg rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default ProductDetail;
