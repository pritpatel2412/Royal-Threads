
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DummyCheckout from '@/components/DummyCheckout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal } = useCart();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-royal-navy mb-4">
              Checkout
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please log in to complete your purchase
            </p>
            <Button asChild className="bg-royal-navy hover:bg-royal-blue">
              <a href="/auth">Login to Continue</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-royal-navy mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Add some items to your cart before checking out
            </p>
            <Button asChild className="bg-royal-navy hover:bg-royal-blue">
              <a href="/shop">Continue Shopping</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-royal-navy mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            <div className="space-x-4">
              <Button onClick={() => navigate('/orders')} className="bg-royal-navy hover:bg-royal-blue">
                View Orders
              </Button>
              <Button variant="outline" onClick={() => navigate('/shop')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-royal-navy mb-4">
            <span className="text-gradient">Checkout</span>
          </h1>
          <p className="text-xl text-gray-600">
            Complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.products.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.products.sku}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ₹{(item.products.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{item.products.price.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <div>
            <DummyCheckout onSuccess={() => setPaymentSuccess(true)} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
