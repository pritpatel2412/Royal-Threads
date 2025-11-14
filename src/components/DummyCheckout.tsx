
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Lock } from 'lucide-react';

interface DummyCheckoutProps {
  onSuccess: () => void;
}

const DummyCheckout = ({ onSuccess }: DummyCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    paymentMethod: 'card'
  });
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const simulatePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your purchase.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add items to proceed with checkout.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting payment simulation...');
    console.log('Cart items:', cartItems);
    console.log('Cart total:', cartTotal);

    setLoading(true);

    try {
      // Generate dummy session ID
      const sessionId = `dummy_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order first
      const orderData = {
        customer_id: user.id,
        order_number: `RT${Date.now()}`,
        email: user.email || '',
        phone: user.phone || '',
        subtotal: cartTotal,
        tax_amount: cartTotal * 0.18, // 18% tax
        shipping_amount: cartTotal > 1000 ? 0 : 50, // Free shipping above ₹1000
        discount_amount: 0,
        total_amount: cartTotal + (cartTotal * 0.18) + (cartTotal > 1000 ? 0 : 50),
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address_line_1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postal_code: '123456',
          country: 'India'
        },
        billing_address: {
          first_name: 'Test',
          last_name: 'User',
          address_line_1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postal_code: '123456',
          country: 'India'
        },
        status: 'processing' as const,
        payment_status: 'completed' as const,
        payment_method: formData.paymentMethod,
        card_last_four: formData.cardNumber.slice(-4),
        currency: 'INR'
      };

      console.log('Creating order with data:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_sku: item.products.sku,
        quantity: item.quantity,
        unit_price: item.products.price,
        total_price: item.products.price * item.quantity
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');

      // Create checkout session record
      const checkoutSessionData = {
        customer_id: user.id,
        order_id: order.id,
        session_id: sessionId,
        status: 'completed',
        payment_method: formData.paymentMethod,
        card_last_four: formData.cardNumber.slice(-4),
        amount: orderData.total_amount,
        currency: 'INR',
        completed_at: new Date().toISOString()
      };

      console.log('Creating checkout session:', checkoutSessionData);

      const { error: sessionError } = await supabase
        .from('checkout_sessions')
        .insert(checkoutSessionData);

      if (sessionError) {
        console.error('Checkout session creation error:', sessionError);
        throw sessionError;
      }

      console.log('Checkout session created successfully');

      // Clear the cart
      await clearCart();
      console.log('Cart cleared successfully');

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Payment Successful!",
        description: `Order ${order.order_number} has been placed successfully.`,
      });

      console.log('Payment simulation completed successfully');
      onSuccess();
    } catch (error) {
      console.error('Payment simulation error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Dummy Payment Gateway
        </CardTitle>
        <p className="text-sm text-gray-600">
          This is a test payment system. No real charges will be made.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Credit/Debit Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="netbanking">Net Banking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.paymentMethod === 'card' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4111 1111 1111 1111"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                maxLength={19}
              />
              <p className="text-xs text-gray-500">Use 4111 1111 1111 1111 for successful test</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>
          </>
        )}

        {formData.paymentMethod === 'upi' && (
          <div className="space-y-2">
            <Label>UPI ID</Label>
            <Input placeholder="yourname@upi" />
            <p className="text-xs text-gray-500">Enter any UPI ID for test</p>
          </div>
        )}

        {formData.paymentMethod === 'netbanking' && (
          <div className="space-y-2">
            <Label>Select Bank</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose your bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sbi">State Bank of India</SelectItem>
                <SelectItem value="hdfc">HDFC Bank</SelectItem>
                <SelectItem value="icici">ICICI Bank</SelectItem>
                <SelectItem value="axis">Axis Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <span>Subtotal:</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Tax (18%):</span>
            <span>₹{(cartTotal * 0.18).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Shipping:</span>
            <span>₹{cartTotal > 1000 ? '0.00' : '50.00'}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₹{(cartTotal + (cartTotal * 0.18) + (cartTotal > 1000 ? 0 : 50)).toFixed(2)}</span>
          </div>
        </div>

        <Button 
          onClick={simulatePayment} 
          disabled={loading} 
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Pay Now
            </div>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          <Lock className="h-3 w-3 inline mr-1" />
          This is a test environment. No real payments will be processed.
        </p>
      </CardContent>
    </Card>
  );
};

export default DummyCheckout;
