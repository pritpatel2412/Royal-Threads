
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const HowToOrder = () => {
  const steps = [
    {
      step: '01',
      title: 'Browse & Select',
      description: 'Explore our curated collection and choose your perfect wedding attire from our premium categories.',
      icon: '👔'
    },
    {
      step: '02',
      title: 'Book Consultation',
      description: 'Schedule a personal consultation with our master tailors for measurements and fabric selection.',
      icon: '📐'
    },
    {
      step: '03',
      title: 'Custom Tailoring',
      description: 'Our artisans craft your outfit with precision, incorporating traditional techniques and modern fit.',
      icon: '✂️'
    },
    {
      step: '04',
      title: 'Final Fitting',
      description: 'Perfect your look with final fittings and receive your complete wedding ensemble with accessories.',
      icon: '👑'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-royal-ivory">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-royal-navy mb-4">
          How to <span className="text-gradient">Order</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your journey to the perfect wedding attire begins here. 
          Follow our simple process to create your dream outfit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <Card 
            key={step.step} 
            className="text-center hover-scale shadow-royal animate-fade-in bg-white"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <CardContent className="p-8">
              <div className="text-5xl mb-6">{step.icon}</div>
              <div className="text-4xl font-serif font-bold text-gradient mb-4">{step.step}</div>
              <h3 className="text-xl font-serif font-bold text-royal-navy mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="bg-white rounded-2xl p-8 shadow-royal max-w-2xl mx-auto animate-fade-in">
          <h3 className="text-2xl font-serif font-bold text-royal-navy mb-4">Ready to Begin?</h3>
          <p className="text-gray-600 mb-6">
            Contact us today to start your journey towards the perfect wedding attire. 
            Our team is ready to make your special day even more memorable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="bg-royal-gold hover:bg-yellow-600 text-royal-navy font-semibold px-8 py-3 rounded-full transition-all duration-300"
              onClick={() => window.open('https://wa.me/919876543210?text=Hello! I would like to start the ordering process.', '_blank')}
            >
              Start on WhatsApp
            </button>
            <button className="border-2 border-royal-navy text-royal-navy hover:bg-royal-navy hover:text-white font-semibold px-8 py-3 rounded-full transition-all duration-300">
              Call Us: +91 98765 43210
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToOrder;
