
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Package, Truck, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { handleSupabaseError, showErrorToast, logError } from '@/utils/errorHandler';
import { Textarea } from '@/components/ui/textarea';

interface AddressData {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

type Order = Tables<'orders'> & {
  order_items: OrderItem[];
  shipping_address: AddressData;
  billing_address: AddressData;
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

type OrderItem = Tables<'order_items'>;

const AdminOrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showCancellationRequestDialog, setShowCancellationRequestDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders with order items
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false });
      
        if (error) {
          const appError = handleSupabaseError(error, 'Fetching orders');
          throw appError;
        }
        
      return data as Order[];
      } catch (error) {
        logError(error, 'Admin orders query');
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle cancellation request (accept/reject)
  const handleCancellationRequestMutation = useMutation({
    mutationFn: async ({ orderId, action, adminResponse }: { orderId: string; action: 'accept' | 'reject'; adminResponse: string }) => {
      try {
        if (action === 'accept') {
          // Get the order details first
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (orderError) {
            const appError = handleSupabaseError(orderError, 'Fetching order details');
            throw appError;
          }

          const orderAmount = parseFloat(order.total_amount.toString());
          const cancellationFee = orderAmount * 0.10; // 10% cancellation fee
          const refundAmount = orderAmount * 0.90; // 90% refund

          // Try full update first, then fallback to basic update
          const { error: fullUpdateError } = await supabase
            .from('orders')
            .update({ 
              status: 'cancelled' as any,
              payment_status: 'refunded',
              cancellation_reason: (order as any).cancellation_request_reason,
              cancellation_fee: cancellationFee,
              refund_amount: refundAmount,
              cancelled_at: new Date().toISOString(),
              admin_response: adminResponse
            })
            .eq('id', orderId);

          if (fullUpdateError) {
            // Fallback to basic update if full update fails
            console.warn('Full cancellation update failed, trying basic update:', fullUpdateError);
            
            const { error: basicUpdateError } = await supabase
              .from('orders')
              .update({ 
                status: 'cancelled' as any,
                payment_status: 'refunded'
              })
              .eq('id', orderId);

            if (basicUpdateError) {
              const appError = handleSupabaseError(basicUpdateError, 'Cancelling order');
              throw appError;
            }
          }

          // Create refund record (will work after database migration)
          try {
            await (supabase as any)
              .from('refunds')
              .insert([{
                order_id: orderId,
                refund_amount: refundAmount,
                cancellation_fee: cancellationFee,
                reason: (order as any).cancellation_request_reason,
                status: 'processed',
                processed_at: new Date().toISOString()
              }]);
          } catch (refundError) {
            console.warn('Failed to create refund record (table may not exist yet):', refundError);
          }

          // Log the cancellation
          try {
            await supabase
              .from('order_status_history')
              .insert([{
                order_id: orderId,
                new_status: 'cancelled',
                changed_by: 'admin',
                notes: `Cancellation request accepted by admin. Refund: ₹${refundAmount.toFixed(2)}, Fee: ₹${cancellationFee.toFixed(2)}. Admin Response: ${adminResponse}`,
              }]);
          } catch (logError) {
            console.warn('Failed to log status change:', logError);
          }

          return { orderAmount, refundAmount, cancellationFee };
        } else {
          // Reject cancellation request
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              status: 'processing' as any,
              admin_response: adminResponse
            })
            .eq('id', orderId);

          if (updateError) {
            const appError = handleSupabaseError(updateError, 'Rejecting cancellation request');
            throw appError;
          }

          // Log the rejection
          try {
            await supabase
              .from('order_status_history')
              .insert([{
                order_id: orderId,
                new_status: 'processing',
                changed_by: 'admin',
                notes: `Cancellation request rejected by admin. Response: ${adminResponse}`,
              }]);
          } catch (logError) {
            console.warn('Failed to log status change:', logError);
          }

          return null;
        }
      } catch (error) {
        logError(error, 'Cancellation request handling');
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-daily-order-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] }); // User side orders
      
      setShowCancellationRequestDialog(false);
      setAdminResponse('');
      setSelectedOrder(null);
      
      if (data) {
        toast({
          title: "Cancellation Request Accepted",
          description: `Order cancelled. ₹${data.refundAmount.toFixed(2)} refunded to customer. ₹${data.cancellationFee.toFixed(2)} cancellation fee retained.`,
        });
      } else {
        toast({
          title: "Cancellation Request Rejected",
          description: "Order will continue processing.",
        });
      }
    },
    onError: (error) => {
      showErrorToast(error, toast);
    },
  });

  // Cancel order mutation (direct admin cancellation)
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      try {
        // Get the order details first
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          const appError = handleSupabaseError(orderError, 'Fetching order details');
          throw appError;
        }

        const orderAmount = parseFloat(order.total_amount.toString());
        const cancellationFee = orderAmount * 0.10; // 10% cancellation fee
        const refundAmount = orderAmount * 0.90; // 90% refund

        // Update order status to cancelled with refund details
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'cancelled' as any,
            payment_status: 'refunded',
            cancellation_reason: reason,
            cancellation_fee: cancellationFee,
            refund_amount: refundAmount,
            cancelled_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          const appError = handleSupabaseError(updateError, 'Cancelling order');
          throw appError;
        }

        // Create refund record (will work after database migration)
        try {
          await (supabase as any)
            .from('refunds')
            .insert([{
              order_id: orderId,
              refund_amount: refundAmount,
              cancellation_fee: cancellationFee,
              reason: reason,
              status: 'processed',
              processed_at: new Date().toISOString()
            }]);
        } catch (refundError) {
          console.warn('Failed to create refund record (table may not exist yet):', refundError);
        }

        // Log the cancellation
        try {
          await supabase
            .from('order_status_history')
            .insert([{
              order_id: orderId,
              new_status: 'cancelled',
              changed_by: 'admin',
              notes: `Order cancelled by admin. Refund: ₹${refundAmount.toFixed(2)}, Cancellation Fee: ₹${cancellationFee.toFixed(2)}. Reason: ${reason}`,
            }]);
        } catch (logError) {
          console.warn('Failed to log status change:', logError);
        }

        return { orderAmount, refundAmount, cancellationFee };
      } catch (error) {
        logError(error, 'Order cancellation');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-daily-order-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      
      setShowCancellationDialog(false);
      setCancellationReason('');
      setSelectedOrder(null);
      
      toast({
        title: "Order Cancelled",
        description: "The order has been successfully cancelled.",
      });
    },
    onError: (error) => {
      showErrorToast(error, toast);
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as any })
        .eq('id', orderId);
      
        if (error) {
          const appError = handleSupabaseError(error, 'Updating order status');
          throw appError;
        }

      // Log the status change
        try {
          await supabase
        .from('order_status_history')
        .insert([{
          order_id: orderId,
          new_status: newStatus,
              changed_by: 'admin',
              notes: `Status updated to ${newStatus}`,
        }]);
        } catch (logError) {
          console.warn('Failed to log status change:', logError);
        }

      } catch (error) {
        logError(error, 'Order status update');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      showErrorToast(error, toast);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'cancellation_requested':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
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
      case 'cancellation_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCancellationDialog(true);
  };

  const handleCancellationRequest = (order: Order) => {
    setSelectedOrder(order);
    setShowCancellationRequestDialog(true);
  };

  const confirmCancelOrder = () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive",
      });
      return;
    }

    cancelOrderMutation.mutate({
      orderId: selectedOrder.id,
      reason: cancellationReason.trim()
    });
  };

  const handleCancellationRequestAction = (action: 'accept' | 'reject') => {
    if (!selectedOrder) return;

    handleCancellationRequestMutation.mutate({
      orderId: selectedOrder.id,
      action,
      adminResponse: adminResponse.trim() || `Cancellation request ${action}ed by admin`
    });
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some(item => 
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (ordersError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <X className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Error Loading Orders
              </h3>
              <p className="text-red-600 mb-4">
                {ordersError instanceof Error ? ordersError.message : 'Failed to load orders'}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredOrders.length} of {orders?.length || 0} orders
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Search orders by number, email, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.email}</p>
                          <p className="text-sm text-gray-600">
                            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                          </p>
                    </div>
                  </TableCell>
                  <TableCell>
                        <div className="text-sm">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{order.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                         <Badge className={`${getStatusColor(order.status || '')} flex items-center gap-1 w-fit`}>
                           {getStatusIcon(order.status || '')}
                           {(order.status as any) === 'cancellation_requested' 
                             ? 'Cancellation Requested' 
                             : order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </Badge>
                         {(order as any).cancellation_requested && (
                           <div className="mt-1 text-xs text-orange-600">
                             Customer requested cancellation
                           </div>
                         )}
                  </TableCell>
                  <TableCell>
                        <div className="text-sm">
                          <p>{new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-gray-600">
                    {formatDistance(new Date(order.created_at), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                  </TableCell>
                  <TableCell>
                         <div className="flex items-center gap-2">
                           <Dialog>
                             <DialogTrigger asChild>
                               <Button variant="outline" size="sm">
                                 <Eye className="h-4 w-4" />
                               </Button>
                             </DialogTrigger>
                             {(order as any).cancellation_requested && (order.status as any) === 'cancellation_requested' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                 onClick={() => handleCancellationRequest(order)}
                               >
                                 Review Request
                               </Button>
                             )}
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Order Items */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.order_items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{item.product_name}</p>
                                          <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">₹{item.total_price.toLocaleString()}</p>
                                          <p className="text-sm text-gray-600">₹{item.unit_price.toLocaleString()} each</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Summary */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Summary</h4>
                                  <div className="space-y-1 text-sm">
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
                                    <div className="flex justify-between font-medium border-t pt-1">
                                      <span>Total:</span>
                                      <span>₹{order.total_amount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping Address */}
                                <div>
                                  <h4 className="font-medium mb-2">Shipping Address</h4>
                                  <div className="text-sm">
                                    <p>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                                    <p>{order.shipping_address?.address_line_1}</p>
                                    {order.shipping_address?.address_line_2 && (
                                      <p>{order.shipping_address.address_line_2}</p>
                                    )}
                                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
                                    <p>{order.shipping_address?.country}</p>
                                  </div>
                                </div>

                                                                 {/* Cancellation Information */}
                                 {order.status === 'cancelled' && (
                                   <div className="border-t pt-4">
                                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                       <h4 className="font-medium text-red-800 mb-2">Order Cancelled</h4>
                                       <div className="text-sm text-red-700 space-y-1">
                                         <div className="flex justify-between">
                                           <span>Original Amount:</span>
                                           <span>₹{order.total_amount.toLocaleString()}</span>
                                         </div>
                                         <div className="flex justify-between text-green-600">
                                           <span>Refund Amount:</span>
                                           <span>₹{(order as any).refund_amount?.toLocaleString() || 0}</span>
                                         </div>
                                         <div className="flex justify-between text-red-600">
                                           <span>Cancellation Fee (10%):</span>
                                           <span>₹{(order as any).cancellation_fee?.toLocaleString() || 0}</span>
                                         </div>
                                         {(order as any).cancellation_reason && (
                                           <div className="mt-2 pt-2 border-t border-red-200">
                                             <p className="font-medium">Cancellation Reason:</p>
                                             <p className="text-xs">{(order as any).cancellation_reason}</p>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {/* Cancellation Request Information */}
                                 {(order.status as any) === 'cancellation_requested' && (
                                   <div className="border-t pt-4">
                                     <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                       <h4 className="font-medium text-orange-800 mb-2">Cancellation Request Pending</h4>
                                       <div className="text-sm text-orange-700 space-y-1">
                                         <p><strong>Customer Reason:</strong> {(order as any).cancellation_request_reason}</p>
                                         <p><strong>Requested At:</strong> {(order as any).cancellation_requested_at ? new Date((order as any).cancellation_requested_at).toLocaleString() : 'N/A'}</p>
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {/* Order Actions */}
                                 <div className="flex gap-2 pt-4 border-t">
                                   {(order.status as any) === 'cancellation_requested' ? (
                                     <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                                         onClick={() => handleCancellationRequestAction('reject')}
                                         disabled={handleCancellationRequestMutation.isPending}
                                       >
                                         {handleCancellationRequestMutation.isPending ? 'Processing...' : 'Reject Request'}
                                       </Button>
                                       <Button
                                         variant="destructive"
                                         size="sm"
                                         onClick={() => handleCancellationRequestAction('accept')}
                                         disabled={handleCancellationRequestMutation.isPending}
                                       >
                                         {handleCancellationRequestMutation.isPending ? 'Processing...' : 'Accept Request'}
                                       </Button>
                                     </div>
                                   ) : order.status !== 'cancelled' && order.status !== 'delivered' ? (
                                     <>
                                       <Select
                                         value={order.status || ''}
                                         onValueChange={(newStatus) => {
                                           updateOrderStatusMutation.mutate({
                                             orderId: order.id,
                                             newStatus
                                           });
                                         }}
                                       >
                                         <SelectTrigger className="w-48">
                                           <SelectValue placeholder="Update status" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="pending">Pending</SelectItem>
                                           <SelectItem value="processing">Processing</SelectItem>
                                           <SelectItem value="shipped">Shipped</SelectItem>
                                           <SelectItem value="delivered">Delivered</SelectItem>
                                           <SelectItem value="cancelled">Cancelled</SelectItem>
                                         </SelectContent>
                                       </Select>
                                       
                                       <Button
                                         variant="destructive"
                                         size="sm"
                                         onClick={() => handleCancelOrder(order)}
                                       >
                                         Cancel Order
                    </Button>
                                     </>
                                   ) : null}
                                 </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Dialog */}
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Cancellation Policy</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 10% cancellation fee will be charged</li>
                <li>• 90% of the order amount will be refunded</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
            
            <div>
              <label className="text-sm font-medium">Cancellation Reason *</label>
              <Textarea
                placeholder="Please provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancellationDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelOrder}
                disabled={cancelOrderMutation.isPending || !cancellationReason.trim()}
              >
                {cancelOrderMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Request Review Dialog */}
      <Dialog open={showCancellationRequestDialog} onOpenChange={setShowCancellationRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Cancellation Request - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Customer Cancellation Request</h4>
              <p className="text-sm text-orange-700">
                <strong>Reason:</strong> {selectedOrder?.cancellation_request_reason}
              </p>
              <p className="text-sm text-orange-700 mt-2">
                <strong>Requested:</strong> {selectedOrder?.cancellation_requested_at ? new Date(selectedOrder.cancellation_requested_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Admin Response (Optional)</label>
              <Textarea
                placeholder="Add a response to the customer..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancellationRequestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCancellationRequestAction('reject')}
                disabled={handleCancellationRequestMutation.isPending}
              >
                {handleCancellationRequestMutation.isPending ? 'Processing...' : 'Reject Request'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleCancellationRequestAction('accept')}
                disabled={handleCancellationRequestMutation.isPending}
              >
                {handleCancellationRequestMutation.isPending ? 'Processing...' : 'Accept Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderManagement;
