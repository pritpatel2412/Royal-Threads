
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const About = () => {
  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-royal-navy mb-6">
            Our <span className="text-gradient">Heritage</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Three decades of crafting dreams into reality, weaving tradition with innovation, 
            and creating memories that last a lifetime.
          </p>
        </div>

        {/* Founder's Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-royal-navy mb-6">
              The Founder's <span className="text-gradient">Vision</span>
            </h2>
            
            <div className="bg-white p-8 rounded-2xl shadow-royal">
              <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed">
                "When I started Royal Threads in 2010, my vision was simple yet profound - 
                to create wedding attire that doesn't just dress a groom, but transforms him into royalty. 
                Every thread we weave carries the dreams of families, the hopes of new beginnings, 
                and the legacy of our rich Indian heritage."
              </blockquote>
              <footer className="text-royal-navy font-semibold">
                — Mr. Naresh Shah, Founder & Master Craftsman
              </footer>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <img
              src="public/images/products/Legacy Brand.jpg"
              alt="Founder's workshop"
              className="w-full rounded-2xl shadow-royal"
            />
          </div>
        </div>

        {/* Craftsmanship Process */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-royal-navy mb-4">
              The Art of <span className="text-gradient">Craftsmanship</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Behind every masterpiece lies hours of meticulous work, passion, and dedication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Fabric Selection',
                description: 'We source the finest silks, brocades, and textiles from across India, ensuring each fabric tells its own story of luxury and tradition.',
                image: 'public/images/products/buying fabric.jpg'
              },
              {
                title: 'Hand Embroidery',
                description: 'Our master embroiderers spend countless hours adding intricate details, using techniques passed down through generations.',
                image: 'public/images/products/hand.jpg'
              },
              {
                title: 'Perfect Fitting',
                description: 'Multiple fittings ensure that each garment fits like a second skin, providing comfort without compromising on elegance.',
                image: 'public/images/products/perfect fitting.webp'
              }
            ].map((process, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl overflow-hidden shadow-royal hover-scale animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <img
                  src={process.image}
                  alt={process.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-royal-navy mb-3">{process.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{process.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-2xl p-12 shadow-royal mb-20 animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-royal-navy mb-4">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="text-xl text-gray-600">The principles that guide every stitch we make</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Heritage',
                description: 'Preserving traditional craftsmanship while embracing modern aesthetics',
                icon: '👑'
              },
              {
                title: 'Quality',
                description: 'Using only the finest materials and maintaining the highest standards',
                icon: '💎'
              },
              {
                title: 'Innovation',
                description: 'Constantly evolving designs to meet contemporary tastes',
                icon: '✨'
              },
              {
                title: 'Service',
                description: 'Providing personalized attention to every client and their dreams',
                icon: '🤝'
              }
            ].map((value, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-serif font-bold text-royal-navy mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-in">
          {[
            { number: '15+', label: 'Years of Excellence' },
            { number: '500+', label: 'Happy Grooms' },
            { number: '30+', label: 'Unique Designs' },
            { number: '10+', label: 'Master Craftsmen' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-royal">
              <div className="text-4xl font-serif font-bold text-royal-navy mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default About;
