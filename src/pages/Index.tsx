import React from 'react';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductCategories from '@/components/ProductCategories';
import TrendingProducts from '@/components/TrendingProducts';
import HowToOrder from '@/components/HowToOrder';
import AboutBrand from '@/components/AboutBrand';
import ClientGallery from '@/components/ClientGallery';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

// AdSense Components
import AdBanner from '@/components/AdBanner';
import AdFluid from '@/components/AdFluid';

const Index = () => {
  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      <Hero />

      {/* Banner Ad */}
      <div className="my-6 flex justify-center">
        <AdBanner />
      </div>

      <ProductCategories />

      {/* Fluid Ad */}
      <div className="my-6 flex justify-center">
        <AdFluid />
      </div>

      <TrendingProducts />

      {/* Banner Ad */}
      <div className="my-6 flex justify-center">
        <AdBanner />
      </div>

      <HowToOrder />
      <AboutBrand />

      {/* Fluid Ad */}
      <div className="my-6 flex justify-center">
        <AdFluid />
      </div>

      <ClientGallery />

      {/* Banner Ad */}
      <div className="my-6 flex justify-center">
        <AdBanner />
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
