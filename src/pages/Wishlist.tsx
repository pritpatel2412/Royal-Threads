
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AddToCartButton from '@/components/AddToCartButton';
import { getProductImage } from '@/utils/productImages';

const Wishlist = () => {
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-royal-navy mb-4">
              Your Wishlist
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please log in to view your wishlist
            </p>
            <Button asChild className="bg-royal-navy hover:bg-royal-blue">
              <Link to="/auth">Login to Continue</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[400px] mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
            Your <span className="text-gradient">Wishlist</span>
          </h1>
          <p className="text-xl text-gray-600">
            {wishlistItems.length > 0 
              ? `You have ${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} in your wishlist`
              : 'Your wishlist is empty'
            }
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-4">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start adding products you love to your wishlist. They'll appear here for easy access.
            </p>
            <Button asChild className="bg-royal-navy hover:bg-royal-blue">
              <Link to="/shop">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlistItems.map((item, index) => {
              const productImage = getProductImage(item.products, index);
              
              return (
              <Card key={item.id} className="group hover-scale shadow-royal transition-all duration-300">
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
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {item.products.is_featured && (
                        <Badge className="bg-royal-gold text-royal-navy font-medium">
                          Featured
                        </Badge>
                      )}
                      {item.products.compare_price && item.products.compare_price > item.products.price && (
                        <Badge className="bg-green-500 text-white font-medium">
                          Sale
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWishlist(item.product_id!)}
                      className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-royal-navy mb-2 group-hover:text-royal-blue transition-colors duration-200">
                      {item.products.name}
                    </h3>
                    
                    {item.products.short_description && (
                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                        {item.products.short_description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-royal-navy">
                          ₹{item.products.price.toLocaleString()}
                        </span>
                        {item.products.compare_price && item.products.compare_price > item.products.price && (
                          <span className="text-lg text-gray-400 line-through">
                            ₹{item.products.compare_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <AddToCartButton
                        productId={item.product_id!}
                        className="w-full bg-royal-navy hover:bg-royal-blue text-white"
                      />
                      
                      <Button 
                        variant="outline"
                        className="w-full border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white"
                        asChild
                      >
                        <Link to={`/product/${item.product_id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Wishlist;
