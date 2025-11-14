
import React from 'react';

const AboutBrand = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-6">
            A Legacy of <span className="text-gradient">Excellence</span>
          </h2>
          
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              For over three decades, Royal Threads has been the epitome of luxury wedding fashion, 
              crafting dreams into reality for discerning grooms across India.
            </p>
            
            <p>
              Our master craftsmen blend time-honored techniques with contemporary design, 
              creating pieces that honor tradition while embracing modern elegance. 
              Each thread tells a story, each stitch carries our passion.
            </p>
            
            <p>
              From the royal courts of Rajasthan to the modern metropolitan weddings, 
              our designs have graced countless celebrations, making every groom feel like royalty.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-royal-navy">15+</div>
              <div className="text-sm text-gray-600">Years Legacy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-royal-navy">500+</div>
              <div className="text-sm text-gray-600">Happy Grooms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-royal-navy">30+</div>
              <div className="text-sm text-gray-600">Unique Designs</div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            <img
              src="public/images/products/Legacy Brand.jpg"
              alt="Royal Threads Heritage"
              className="w-full rounded-2xl shadow-royal"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-navy/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutBrand;
