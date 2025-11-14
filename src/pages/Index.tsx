
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

const Index = () => {
  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      <Hero />
      <ProductCategories />
      <TrendingProducts />
      <HowToOrder />
      <AboutBrand />
      <ClientGallery />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
