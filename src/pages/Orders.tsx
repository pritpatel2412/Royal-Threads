
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { handleSupabaseError, showErrorToast, logError } from '@/utils/errorHandler';

type Order = Tables<'orders'> & {
  order_items: (Tables<'order_items'> & {
    products: Tables<'products'>;
  })[];
  // Extended fields for cancellation functionality
  cancellation_requested?: boolean;
  cancellation_request_reason?: string;
  cancellation_requested_at?: string;
  admin_response?: string;
  cancellation_reason?: string;
  cancellation_fee?: number;
  refund_amount?: number;
  cancelled_at?: string;
};

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelRequestDialog, setCancelRequestDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: orders = [], isLoading, error: ordersError } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          const appError = handleSupabaseError(error, 'Fetching orders');
          throw appError;
        }
        
        return data as Order[];
      } catch (error) {
        logError(error, 'Orders query');
        throw error;
      }
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Cancel order request mutation (user-initiated)
  const cancelOrderRequestMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      try {
        // First try to update with all cancellation fields
        const { error: fullUpdateError } = await supabase
          .from('orders')
          .update({
            cancellation_requested: true,
            cancellation_request_reason: reason,
            cancellation_requested_at: new Date().toISOString(),
            status: 'cancellation_requested' as any
          })
          .eq('id', orderId);

        if (fullUpdateError) {
          // If full update fails, try with basic fields only
          console.warn('Full cancellation update failed, trying basic update:', fullUpdateError);
          
          const { error: basicUpdateError } = await supabase
            .from('orders')
            .update({
              status: 'cancellation_requested' as any
            })
            .eq('id', orderId);

          if (basicUpdateError) {
            const appError = handleSupabaseError(basicUpdateError, 'Requesting cancellation');
            throw appError;
          }
        }

        // Log the cancellation request
        try {
          await supabase
            .from('order_status_history')
            .insert([{
              order_id: orderId,
              new_status: 'cancellation_requested',
              changed_by: user?.id,
              notes: `Cancellation requested by customer. Reason: ${reason}`,
            }]);
        } catch (logError) {
          console.warn('Failed to log cancellation request:', logError);
        }
      } catch (error) {
        logError(error, 'Order cancellation request');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      setCancelRequestDialog(false);
      setCancelReason('');
      setSelectedOrder(null);
      toast({
        title: "Cancellation Request Sent",
        description: "Your cancellation request has been sent to admin for review. You will be notified of the decision.",
      });
    },
    onError: (error) => {
      console.error('Cancellation request error:', error);
      
      // Check if it's a schema error
      if (error instanceof Error && error.message.includes('cancellation_request_reason')) {
        toast({
          title: "Database Schema Error",
          description: "Please run the database migration first. Check the fix_database_schema.md file for instructions.",
          variant: "destructive",
        });
      } else {
        showErrorToast(error, toast);
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canRequestCancellation = (order: Order) => {
    return ['pending', 'processing'].includes(order.status || '') && !order.cancellation_requested;
  };

  const handleCancelRequest = (order: Order) => {
    setSelectedOrder(order);
    setCancelRequestDialog(true);
  };

  const confirmCancelRequest = () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive",
      });
      return;
    }

    cancelOrderRequestMutation.mutate({
      orderId: selectedOrder.id,
      reason: cancelReason.trim()
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-royal-ivory">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-royal-navy mb-4">
              My Orders
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please log in to view your orders
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

  return (
    <div className="min-h-screen bg-royal-ivory">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-royal-navy mb-4">
            My <span className="text-gradient">Orders</span>
          </h1>
          <p className="text-xl text-gray-600">
            {orders.length > 0 
              ? `You have ${orders.length} order${orders.length !== 1 ? 's' : ''}`
              : 'Track your order history and status'
            }
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : ordersError ? (
          <div className="text-center py-20">
            <X className="h-24 w-24 text-red-300 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-red-800 mb-4">
              Error Loading Orders
            </h3>
            <p className="text-red-600 mb-8 max-w-md mx-auto">
              {ordersError instanceof Error ? ordersError.message : 'Failed to load your orders. Please try again later.'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-4">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild className="bg-royal-navy hover:bg-royal-blue">
              <a href="/shop">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Start Shopping
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-royal">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-serif text-royal-navy">
                        Order #{order.order_number}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.cancellation_requested && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800 font-medium">
                            Cancellation Request Pending
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            Admin will review your request and respond soon.
                          </p>
                          {order.cancellation_request_reason && (
                            <p className="text-xs text-orange-600 mt-1">
                              Reason: {order.cancellation_request_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(order.status || '')} flex items-center gap-1`}>
                        {getStatusIcon(order.status || '')}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </Badge>
                      <div className="text-right">
                        <p className="text-lg font-bold text-royal-navy">
                          ₹{order.total_amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ₹{item.total_price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{item.unit_price.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Shipping Address */}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                          <div className="text-sm text-gray-600">
                            {order.shipping_address && typeof order.shipping_address === 'object' && (
                              <div>
                                <p>{(order.shipping_address as any).first_name} {(order.shipping_address as any).last_name}</p>
                                <p>{(order.shipping_address as any).address_line_1}</p>
                                {(order.shipping_address as any).address_line_2 && (
                                  <p>{(order.shipping_address as any).address_line_2}</p>
                                )}
                                <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).state} {(order.shipping_address as any).postal_code}</p>
                                <p>{(order.shipping_address as any).country}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Totals */}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{order.subtotal.toLocaleString()}</span>
                            </div>
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span>-₹{order.discount_amount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Shipping:</span>
                              <span>₹{order.shipping_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>₹{order.tax_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium text-royal-navy border-t pt-1">
                              <span>Total:</span>
                              <span>₹{order.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Write Review
                        </Button>
                      )}
                      {canRequestCancellation(order) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleCancelRequest(order)}
                        >
                          Request Cancellation
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Request Dialog */}
      <Dialog open={cancelRequestDialog} onOpenChange={setCancelRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Order Cancellation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Cancellation Policy</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Your request will be reviewed by admin</li>
                <li>• If approved: 90% refund, 10% cancellation fee</li>
                <li>• If rejected: Order continues processing</li>
                <li>• You will be notified of the decision</li>
              </ul>
            </div>
            
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please provide a reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelRequestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelRequest}
                disabled={cancelOrderRequestMutation.isPending || !cancelReason.trim()}
              >
                {cancelOrderRequestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Orders;
