
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

const CartCheckoutButton = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (cartItems.length === 0) {
      return;
    }
    
    // Navigate to checkout page which contains the dummy payment gateway
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">Total:</span>
        <span className="text-xl font-bold">₹{cartTotal.toFixed(2)}</span>
      </div>
      <Button 
        onClick={handleCheckout}
        className="w-full"
        size="lg"
        disabled={cartItems.length === 0 || !user}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Proceed to Checkout
      </Button>
    </div>
  );
};

export default CartCheckoutButton;
