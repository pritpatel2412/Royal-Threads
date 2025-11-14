
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Image as ImageIcon } from 'lucide-react';
import WishlistButton from '@/components/WishlistButton';
import AddToCartButton from '@/components/AddToCartButton';
import ProductTags from '@/components/ProductTags';
import { getProductImage } from '@/utils/productImages';
import { url } from 'inspector';

const TrendingProducts = () => {
  // Fetch products with their images and tags from database
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary,
            sort_order
          ),
          product_tag_assignments (
            id,
            product_tags (
              id,
              name,
              color,
              text_color,
              sort_order
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });



  // Get featured products or first 4 products
  const featuredProducts = products
    .filter(product => product.is_featured && (product.stock_quantity || 0) > 0)
    .slice(0, 4);

  // If not enough featured products, supplement with regular products
  const displayProducts = featuredProducts.length >= 4 
    ? featuredProducts 
    : [
        ...featuredProducts,
        ...products
          .filter(product => !product.is_featured && (product.stock_quantity || 0) > 0)
          .slice(0, 4 - featuredProducts.length)
      ];

  if (isLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[600px] mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
            Our Collection <span className="text-gradient">Coming Soon</span>
          </h2>
          <p className="text-xl text-gray-600">
            We're preparing beautiful pieces for you. Stay tuned!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
          Trending <span className="text-gradient">Masterpieces</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Our most coveted designs, loved by grooms across the nation. 
          Each piece represents the pinnacle of Indian wedding fashion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {displayProducts.map((product, index) => {
          const productImage = getProductImage(product, index);
          const productTags = product.product_tag_assignments?.map(assignment => assignment.product_tags).filter(Boolean) || [];
          
          return (
            <Card 
              key={product.id} 
              className="group hover-scale shadow-royal animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  {productImage.url ? (
                    <img
                      src={productImage.url}
                      alt={productImage.alt}
                      className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/products/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Custom Tags */}
                  <div className="absolute top-4 left-4">
                    <ProductTags tags={productTags} />
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <WishlistButton 
                      productId={product.id}
                      variant="ghost"
                      className="bg-white/80 backdrop-blur-sm hover:bg-white"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 space-y-2">
                    <AddToCartButton
                      productId={product.id}
                      variant="default"
                      className="w-full bg-royal-navy hover:bg-royal-blue text-white"
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-white/90 text-royal-navy hover:bg-white backdrop-blur-sm"
                    >
                      <Link to={`/product/${product.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      Premium Collection
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-serif font-bold text-royal-navy mb-2 group-hover:text-royal-blue transition-colors duration-200">
                    {product.name}
                  </h3>
                  
                  {product.short_description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {product.short_description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-royal-navy">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-lg text-gray-400 line-through">
                          ₹{product.compare_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    asChild
                    className="w-full bg-royal-navy hover:bg-royal-blue text-white font-medium py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Link to={`/product/${product.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button 
          asChild
          variant="outline"
          className="border-2 border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white px-8 py-3 text-lg rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Link to="/shop">Explore Full Collection</Link>
        </Button>
      </div>
    </section>
  );
};

export default TrendingProducts;
