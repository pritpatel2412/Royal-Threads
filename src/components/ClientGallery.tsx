
import React from 'react';

const ClientGallery = () => {
  const galleryImages = [
    '/images/products/happy client 1.jpeg',
    '/images/products/happy client 2.jpg',
    '/images/products/happy client 3.jpg',
    '/images/products/rohit-anniversary.jpg',
    '/images/products/happy client 5.jpg',
    '/images/products/happy client 6.webp'
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-royal-ivory">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
          Our <span className="text-gradient">Happy Grooms</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Witness the joy and elegance of our clients on their special day. 
          Each photo tells a story of dreams fulfilled and traditions honored.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {galleryImages.map((image, index) => (
          <div 
            key={index} 
            className="aspect-square overflow-hidden rounded-lg hover-scale animate-fade-in shadow-royal"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <img
              src={image}
              alt={`Happy client ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-lg text-gray-600 mb-6 italic">
          "Every thread woven with love, every design crafted with passion"
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => window.open('https://instagram.com', '_blank')}
          >
            Follow us on Instagram
          </button>
          <span className="text-gray-400">•</span>
          <button 
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => window.open('https://facebook.com', '_blank')}
          >
            Like us on Facebook
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClientGallery;
