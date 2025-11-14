
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existingSubscription } = await supabase
        .from('newsletter_subscriptions')
        .select('id, is_active')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingSubscription) {
        if (existingSubscription.is_active) {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
          });
          setEmail('');
          setIsLoading(false);
          return;
        } else {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from('newsletter_subscriptions')
            .update({
              is_active: true,
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null,
            })
            .eq('id', existingSubscription.id);

          if (updateError) throw updateError;

          toast({
            title: "Welcome back!",
            description: "Your subscription has been reactivated.",
          });
          setEmail('');
          setIsLoading(false);
          return;
        }
      }

      // Insert new subscription
      const { error: insertError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: email.toLowerCase().trim(),
          is_active: true,
        });

      if (insertError) {
        // Handle unique constraint violation (race condition)
        if (insertError.code === '23505') {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
          });
        } else {
          throw insertError;
        }
      } else {
        toast({
          title: "Subscribed successfully!",
          description: "Thank you for subscribing! You'll receive our latest updates and exclusive offers.",
        });
      }

      setEmail('');
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <footer className="bg-royal-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-serif font-bold mb-4">
              Royal <span className="text-royal-gold">Threads</span>
            </h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Crafting royalty for over three decades. Where tradition meets elegance, 
              and every stitch tells a story of heritage and craftsmanship.
            </p>
            <div className="flex space-x-4">
              <button 
                className="text-royal-gold hover:text-yellow-400 transition-colors"
                onClick={() => window.open('https://instagram.com', '_blank')}
              >
                Instagram
              </button>
              <button 
                className="text-royal-gold hover:text-yellow-400 transition-colors"
                onClick={() => window.open('https://facebook.com', '_blank')}
              >
                Facebook
              </button>
              <button 
                className="text-royal-gold hover:text-yellow-400 transition-colors"
                onClick={() => window.open('https://wa.me/919876543210', '_blank')}
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/shop" className="text-gray-300 hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Store Info */}
          <div>
            <h4 className="text-lg font-serif font-semibold mb-4">Store Info</h4>
            <div className="space-y-3 text-gray-300">
              <p>📍 Kalupur, Ahmedabad</p>
              <p>📞 +91 98765 43210</p>
              <p>✉️ info@royalthreads.com</p>
              <p>🕒 Mon-Sun: 10 AM - 8 PM</p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h4 className="text-lg font-serif font-semibold mb-2">Stay Updated</h4>
              <p className="text-gray-300">Subscribe to our newsletter for latest collections and exclusive offers.</p>
            </div>
            <form 
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="px-4 py-2 rounded-full bg-white text-royal-navy flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-royal-gold disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-royal-gold hover:bg-yellow-600 text-royal-navy font-semibold px-6 py-2 rounded-full transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-royal-gold"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 Royal Threads. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/returns" className="hover:text-white transition-colors">Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
