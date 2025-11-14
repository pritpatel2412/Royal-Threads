
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `url("/images/products/Royal Threads.png")`
  }}
/>

      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
          Crafting Royalty,<br />
          <span className="text-gradient">One Stitch at a Time</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-gray-200 font-light max-w-2xl mx-auto">
          Where tradition meets elegance. Discover our exquisite collection of 
          premium wedding attire crafted for the modern Indian groom.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            asChild
            className="bg-royal-gold hover:bg-yellow-300 text-royal-navy font-semibold px-8 py-3 text-lg rounded-full transition-all duration-300"
          >
            <Link to="/shop">Explore Sherwanis</Link>
          </Button>
          
          <Button 
            
            className="bg-royal-gold hover:bg-yellow-600 text-royal-navy font-semibold px-8 py-3 text-lg rounded-full transition-all duration-300"
            onClick={() => window.open('https://wa.me/919876543210?text=Hello! I would like to book a trial.', '_blank')}
          >
            Book a Trial
          </Button>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        
      </div>
    </section>
  );
};

export default Hero;
