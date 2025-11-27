
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const ProductCategories = () => {
  const categories = [
    {
      id: 'sherwani',
      name: 'Sherwani',
      description: 'Royal elegance redefined',
      image: '/images/products/sherwani.JPG',
      count: '25+ Designs'
    },
    {
      id: 'indo-western',
      name: 'Indo-Western',
      description: 'Contemporary meets traditional',
      image: '/images/products/indo-western.JPG',
      count: '18+ Designs'
    },
    {
      id: 'jodhpuri',
      name: 'Jodhpuri Suits',
      description: 'Maharaja inspired luxury',
      image: '/images/products/jodhpuri.jpg',
      count: '20+ Designs'
    },
    {
      id: 'groom-sets',
      name: 'Groom Sets',
      description: 'Complete wedding ensembles',
      image: '/images/products/groom-sets.webp',
      count: '15+ Collections'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
          Our Exclusive <span className="text-gradient">Collections</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover our curated selection of premium wedding attire, 
          each piece telling a story of heritage and craftsmanship.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map((category, index) => (
          <Card 
            key={category.id} 
            className="group hover-scale cursor-pointer shadow-royal animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Link to={`/shop?category=${category.id}`}>
              <CardContent className="p-0 relative overflow-hidden rounded-lg">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-navy/80 via-transparent to-transparent" />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-serif font-bold mb-2">{category.name}</h3>
                  <p className="text-gray-200 mb-2">{category.description}</p>
                  <span className="text-royal-gold font-medium">{category.count}</span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ProductCategories;
