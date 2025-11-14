# Cancellation System Guide

## Overview
This guide explains the complete cancellation system implemented in the Indian Groom Elegance project, including user-initiated cancellation requests and admin review process.

## 🎯 System Flow

### 1. User-Initiated Cancellation Request
```
User → Request Cancellation → Admin Review → Accept/Reject → Update Order Status
```

### 2. Admin-Initiated Cancellation
```
Admin → Cancel Order → Apply Refund Policy → Update Order Status
```

## 📋 Database Schema

### Orders Table Extensions
```sql
-- New fields added to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;
```

### Refunds Table
```sql
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  refund_amount DECIMAL(10,2) NOT NULL,
  cancellation_fee DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Order Status Flow

### Normal Flow
1. **Pending** → Order placed, awaiting confirmation
2. **Processing** → Order confirmed, being prepared
3. **Shipped** → Order dispatched to customer
4. **Delivered** → Order successfully delivered

### Cancellation Flow
1. **Pending/Processing** → User requests cancellation
2. **Cancellation Requested** → Admin reviews request
3. **Cancelled** → Admin accepts request (with refund)
4. **Processing** → Admin rejects request (order continues)

## 💰 Refund Policy

### When Admin Accepts Cancellation Request
- **10% Cancellation Fee**: Retained by the business
- **90% Refund**: Returned to customer
- **Total Revenue Impact**: +10% of order amount

### When Admin Rejects Cancellation Request
- **No Fee**: No charges applied
- **No Refund**: Order continues processing
- **Total Revenue Impact**: No change

## 🎨 User Interface

### User Side (Orders.tsx)

#### Cancellation Request Button
- Only visible for `pending` or `processing` orders
- Hidden if cancellation already requested
- Opens dialog to provide cancellation reason

#### Cancellation Request Status
```typescript
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
```

#### Cancelled Order Information
```typescript
{order.status === 'cancelled' && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <h4 className="font-medium text-red-800 mb-2">Order Cancelled</h4>
    <div className="text-sm text-red-700 space-y-1">
      <div className="flex justify-between">
        <span>Original Amount:</span>
        <span>₹{order.total_amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-green-600">
        <span>Refund Amount:</span>
        <span>₹{order.refund_amount?.toLocaleString() || 0}</span>
      </div>
      <div className="flex justify-between text-red-600">
        <span>Cancellation Fee (10%):</span>
        <span>₹{order.cancellation_fee?.toLocaleString() || 0}</span>
      </div>
    </div>
  </div>
)}
```

### Admin Side (AdminOrderManagement.tsx)

#### Order Status Display
- **Cancellation Requested**: Orange badge with warning icon
- **Cancelled**: Red badge with X icon
- **Processing**: Blue badge with package icon

#### Cancellation Request Review
```typescript
{order.status === 'cancellation_requested' && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
    <h4 className="font-medium text-orange-800 mb-2">Cancellation Request Pending</h4>
    <div className="text-sm text-orange-700 space-y-1">
      <p><strong>Customer Reason:</strong> {order.cancellation_request_reason}</p>
      <p><strong>Requested At:</strong> {new Date(order.cancellation_requested_at).toLocaleString()}</p>
    </div>
  </div>
)}
```

#### Action Buttons
- **Accept Request**: Applies refund policy and cancels order
- **Reject Request**: Continues order processing
- **Cancel Order**: Direct admin cancellation (bypasses user request)

## 🔧 Technical Implementation

### User-Side Mutation
```typescript
const cancelOrderRequestMutation = useMutation({
  mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
    const { error } = await supabase
      .from('orders')
      .update({
        cancellation_requested: true,
        cancellation_request_reason: reason,
        cancellation_requested_at: new Date().toISOString(),
        status: 'cancellation_requested' as any
      })
      .eq('id', orderId);

    if (error) throw error;
  },
  onSuccess: () => {
    toast({
      title: "Cancellation Request Sent",
      description: "Your cancellation request has been sent to admin for review.",
    });
  },
});
```

### Admin-Side Mutation
```typescript
const handleCancellationRequestMutation = useMutation({
  mutationFn: async ({ orderId, action, adminResponse }: { 
    orderId: string; 
    action: 'accept' | 'reject'; 
    adminResponse: string 
  }) => {
    if (action === 'accept') {
      // Calculate refund amounts
      const orderAmount = parseFloat(order.total_amount.toString());
      const cancellationFee = orderAmount * 0.10;
      const refundAmount = orderAmount * 0.90;

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelled' as any,
          payment_status: 'refunded',
          cancellation_fee: cancellationFee,
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString(),
          admin_response: adminResponse
        })
        .eq('id', orderId);

      // Create refund record
      await supabase
        .from('refunds')
        .insert([{
          order_id: orderId,
          refund_amount: refundAmount,
          cancellation_fee: cancellationFee,
          reason: order.cancellation_request_reason,
          status: 'processed',
          processed_at: new Date().toISOString()
        }]);
    } else {
      // Reject request - continue processing
      await supabase
        .from('orders')
        .update({ 
          status: 'processing' as any,
          admin_response: adminResponse
        })
        .eq('id', orderId);
    }
  },
});
```

## 📊 Analytics Impact

### Revenue Calculation
```typescript
// Include cancellation fees in total revenue
const totalRevenue = orders
  .filter(order => order.status !== 'cancelled')
  .reduce((sum, order) => sum + order.total_amount, 0) +
  orders
    .filter(order => order.status === 'cancelled')
    .reduce((sum, order) => sum + (order.cancellation_fee || 0), 0);
```

### Order Statistics
- **Total Orders**: All orders including cancelled
- **Completed Orders**: Delivered orders only
- **Cancelled Orders**: Orders with cancelled status
- **Cancellation Rate**: (Cancelled Orders / Total Orders) * 100

## 🛡️ Error Handling

### Database Errors
- **Table Not Found**: Graceful fallback for missing tables
- **Column Not Found**: Type assertions for missing fields
- **Constraint Violations**: Proper error messages

### Network Errors
- **Connection Issues**: Retry logic with exponential backoff
- **Timeout Errors**: User-friendly error messages
- **Authentication Errors**: Redirect to login

### Validation Errors
- **Required Fields**: Form validation
- **Invalid Data**: Input sanitization
- **Business Rules**: Order status validation

## 🔄 State Management

### Query Invalidation
```typescript
// Invalidate relevant queries after cancellation
queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
queryClient.invalidateQueries({ queryKey: ['admin-order-analytics'] });
queryClient.invalidateQueries({ queryKey: ['user-orders'] });
```

### Real-time Updates
- **User Side**: Immediate status update after request
- **Admin Side**: Real-time order list updates
- **Analytics**: Live dashboard updates

## 📱 User Experience

### Loading States
- **Request Sending**: Show loading spinner
- **Admin Processing**: Disable action buttons
- **Status Updates**: Smooth transitions

### Feedback Messages
- **Success**: Clear confirmation messages
- **Error**: Helpful error descriptions
- **Pending**: Status indicators

### Accessibility
- **Screen Readers**: Proper ARIA labels
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: WCAG compliant color schemes

## 🧪 Testing Scenarios

### User Cancellation Request
1. User places order
2. User requests cancellation with reason
3. Verify request is sent to admin
4. Verify user sees pending status

### Admin Acceptance
1. Admin receives cancellation request
2. Admin reviews customer reason
3. Admin accepts request
4. Verify refund calculation (90% refund, 10% fee)
5. Verify order status changes to cancelled
6. Verify user sees cancellation details

### Admin Rejection
1. Admin receives cancellation request
2. Admin rejects request with reason
3. Verify order status returns to processing
4. Verify user is notified of rejection

### Error Scenarios
1. Network failure during request
2. Database connection issues
3. Invalid order status transitions
4. Missing required fields

## 🚀 Deployment Checklist

### Database Migration
- [ ] Run `supabase_migration_manual.sql` in Supabase dashboard
- [ ] Verify new columns are added to orders table
- [ ] Verify refunds table is created
- [ ] Test RLS policies

### Application Deployment
- [ ] Deploy updated components
- [ ] Test cancellation flow end-to-end
- [ ] Verify analytics calculations
- [ ] Test error handling scenarios

### Monitoring
- [ ] Set up error tracking
- [ ] Monitor cancellation rates
- [ ] Track refund processing times
- [ ] Alert on failed operations

## 📈 Business Impact

### Revenue Protection
- **Cancellation Fees**: 10% retention on cancelled orders
- **Processing Efficiency**: Automated refund calculations
- **Customer Satisfaction**: Transparent cancellation process

### Operational Benefits
- **Admin Control**: Review and approve cancellation requests
- **Audit Trail**: Complete history of cancellation decisions
- **Analytics**: Detailed cancellation metrics

### Customer Experience
- **Transparency**: Clear cancellation policy
- **Flexibility**: Request cancellation for valid reasons
- **Communication**: Status updates throughout process

## 🔮 Future Enhancements

### Planned Features
- **Email Notifications**: Automated status updates
- **SMS Alerts**: Real-time cancellation notifications
- **Partial Refunds**: Support for partial order cancellations
- **Cancellation Reasons**: Predefined reason categories

### Integration Opportunities
- **Payment Gateway**: Direct refund processing
- **Inventory Management**: Automatic stock restoration
- **Customer Support**: Integration with help desk
- **Analytics Platform**: Advanced cancellation analytics

