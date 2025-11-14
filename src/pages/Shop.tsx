import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import WishlistButton from '@/components/WishlistButton';
import AddToCartButton from '@/components/AddToCartButton';
import ProductTags from '@/components/ProductTags';
import { getProductImage } from '@/utils/productImages';

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const categoryMatch = selectedCategory === 'all' || product.category_id === selectedCategory;
      const priceMatch = priceRange === 'all' || 
        (priceRange === 'under-25k' && product.price < 25000) ||
        (priceRange === '25k-40k' && product.price >= 25000 && product.price <= 40000) ||
        (priceRange === 'above-40k' && product.price > 40000);
      const searchMatch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && priceMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'featured':
        default:
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
    });

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const allCategories = [
    { id: 'all', name: 'All Products', slug: 'all' },
    ...categories.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }))
  ];

  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
            Our Exquisite <span className="text-gradient">Collection</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover premium wedding attire crafted with passion and precision for your special day.
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 rounded-full focus:border-royal-navy"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-full focus:border-royal-navy bg-white"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
            
            <div className="flex rounded-full border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-royal-navy text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-royal-navy text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden border-2 border-gray-200 rounded-full"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl p-6 shadow-royal sticky top-4">
              <h3 className="text-xl font-serif font-bold text-royal-navy mb-6">Filters</h3>
              
              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Category</h4>
                <div className="space-y-2">
                  {allCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-royal-navy text-white shadow-md'
                          : 'text-gray-600 hover:bg-royal-ivory hover:text-royal-navy'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                <div className="space-y-2">
                  {[
                    { id: 'all', name: 'All Prices' },
                    { id: 'under-25k', name: 'Under ₹25,000' },
                    { id: '25k-40k', name: '₹25,000 - ₹40,000' },
                    { id: 'above-40k', name: 'Above ₹40,000' }
                  ].map(range => (
                    <button
                      key={range.id}
                      onClick={() => setPriceRange(range.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
                        priceRange === range.id
                          ? 'bg-royal-navy text-white shadow-md'
                          : 'text-gray-600 hover:bg-royal-ivory hover:text-royal-navy'
                      }`}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategory !== 'all' || priceRange !== 'all' || searchTerm !== '') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('all');
                      setPriceRange('all');
                      setSearchTerm('');
                    }}
                    className="w-full border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <Button
                    onClick={() => {
                      setSelectedCategory('all');
                      setPriceRange('all');
                      setSearchTerm('');
                    }}
                    className="bg-royal-navy hover:bg-royal-blue text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`grid gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map((product) => {
                  const productTags = product.product_tag_assignments?.map(assignment => assignment.product_tags).filter(Boolean) || [];
                  
                  return (
                    <Card key={product.id} className="group hover-scale shadow-royal transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={getProductImage(product).url}
                            alt={getProductImage(product).alt}
                            className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                              viewMode === 'grid' ? 'h-80' : 'h-64'
                            }`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/products/placeholder.svg';
                            }}
                          />
                          <div className="absolute top-4 left-4">
                            <ProductTags tags={productTags} />
                          </div>

                          {/* Wishlist Button */}
                          <div className="absolute top-4 right-4">
                            <WishlistButton 
                              productId={product.id}
                              variant="ghost"
                              className="bg-white/80 backdrop-blur-sm hover:bg-white"
                            />
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="mb-2">
                            <span className="text-sm text-gray-500 uppercase tracking-wide">
                              {categories.find(cat => cat.id === product.category_id)?.name || 'Wedding Wear'}
                            </span>
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
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {(product.stock_quantity || 0) > 0 ? (
                              <>
                                <AddToCartButton
                                  productId={product.id}
                                  className="w-full bg-royal-navy hover:bg-royal-blue text-white"
                                />
                                <Button 
                                  asChild
                                  variant="outline"
                                  className="w-full border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white"
                                >
                                  <Link to={`/product/${product.id}`}>View Details</Link>
                                </Button>
                              </>
                            ) : (
                              <Button 
                                disabled
                                className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                              >
                                Out of Stock
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Shop;
