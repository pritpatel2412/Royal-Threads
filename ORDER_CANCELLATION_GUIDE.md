# Order Cancellation System Guide

## 🎯 Overview
This guide explains the complete order cancellation system that handles refunds, cancellation fees, and revenue adjustments.

## 🔧 How It Works

### **Cancellation Process**
1. **Admin cancels order** through admin panel
2. **System calculates** 90% refund + 10% cancellation fee
3. **Database updates** with cancellation details
4. **Revenue adjusts** automatically in analytics
5. **User sees** cancellation status and refund information

### **Financial Breakdown**
- **Original Order Amount**: ₹1000
- **Refund to Customer**: ₹900 (90%)
- **Cancellation Fee**: ₹100 (10%)
- **Net Revenue Impact**: ₹100 (cancellation fee retained)

## 📊 Database Schema

### **Orders Table Updates**
```sql
-- New fields added to orders table
cancellation_reason TEXT,           -- Reason for cancellation
cancellation_fee DECIMAL(10,2),     -- 10% fee retained
refund_amount DECIMAL(10,2),        -- 90% refunded to customer
cancelled_at TIMESTAMP WITH TIME ZONE -- When order was cancelled
```

### **Refunds Table**
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  refund_amount DECIMAL(10,2),      -- Amount refunded
  cancellation_fee DECIMAL(10,2),   -- Fee retained
  reason TEXT,                      -- Cancellation reason
  status TEXT,                      -- pending/processed/failed
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
);
```

## 🎛️ Admin Panel Features

### **Cancellation Dialog**
- **Confirmation dialog** before cancellation
- **Reason required** for cancellation
- **Policy explanation** (90% refund, 10% fee)
- **Real-time processing** with loading states

### **Order Management**
- **Status updates** for all order statuses
- **Special handling** for cancellation status
- **Detailed order view** with cancellation info
- **Query invalidation** for real-time updates

### **Analytics Integration**
- **Revenue calculation** excludes cancelled orders
- **Cancellation fees** added to revenue
- **Real-time updates** in dashboard
- **Growth rate** calculations adjusted

## 👤 User Side Features

### **Order Status Display**
- **Cancelled badge** with red styling
- **Refund information** prominently displayed
- **Cancellation fee** clearly shown
- **Reason for cancellation** if provided

### **Order Details**
- **Original amount** vs refund amount
- **Cancellation fee** breakdown
- **Refund status** and processing info
- **Timeline** of cancellation

## 🔄 Revenue Calculation Logic

### **Before Cancellation**
```
Total Revenue = Sum of all order amounts
```

### **After Cancellation**
```
Total Revenue = Sum of non-cancelled orders + Sum of cancellation fees
```

### **Example Calculation**
```
Orders: ₹1000, ₹2000, ₹1500 (cancelled), ₹3000
Cancellation Fee: ₹150 (10% of ₹1500)

Total Revenue = ₹1000 + ₹2000 + ₹3000 + ₹150 = ₹6150
```

## 📈 Analytics Dashboard Updates

### **Revenue Metrics**
- **Total Revenue**: Includes cancellation fees
- **Growth Rate**: Adjusted for cancellations
- **Order Count**: All orders (including cancelled)
- **Average Order Value**: Based on final revenue

### **Order Status Distribution**
- **Cancelled orders** shown separately
- **Percentage breakdown** of all statuses
- **Real-time updates** when orders cancelled

## 🛠️ Technical Implementation

### **Admin Order Management**
```typescript
// Cancellation mutation
const cancelOrderMutation = useMutation({
  mutationFn: async ({ orderId, reason }) => {
    const orderAmount = parseFloat(order.total_amount);
    const cancellationFee = orderAmount * 0.10;
    const refundAmount = orderAmount * 0.90;
    
    // Update order status
    await supabase.from('orders').update({
      status: 'cancelled',
      payment_status: 'refunded',
      cancellation_reason: reason,
      cancellation_fee: cancellationFee,
      refund_amount: refundAmount,
      cancelled_at: new Date().toISOString()
    });
    
    // Create refund record
    await supabase.from('refunds').insert({
      order_id: orderId,
      refund_amount: refundAmount,
      cancellation_fee: cancellationFee,
      reason: reason,
      status: 'processed'
    });
  }
});
```

### **Analytics Hook**
```typescript
// Revenue calculation with cancellation fees
const totalRevenue = data
  .filter(order => order.status !== 'cancelled')
  .reduce((sum, order) => sum + parseFloat(order.total_amount), 0) +
  data
    .filter(order => order.status === 'cancelled')
    .reduce((sum, order) => sum + parseFloat(order.cancellation_fee || '0'), 0);
```

## 🎨 UI Components

### **Cancellation Dialog**
- **Warning styling** with yellow background
- **Policy explanation** clearly visible
- **Reason input** required field
- **Confirmation buttons** with proper states

### **Order Status Badges**
- **Cancelled**: Red badge with X icon
- **Refunded**: Green badge for payment status
- **Processing**: Blue badge for refund processing

### **User Order Display**
- **Cancellation info** in red box
- **Refund amounts** in green
- **Fee amounts** in red
- **Reason display** if available

## 🔍 Error Handling

### **Validation**
- **Reason required** before cancellation
- **Order status** validation
- **Amount calculations** error handling
- **Database transaction** rollback

### **User Feedback**
- **Success messages** with refund details
- **Error messages** for failed cancellations
- **Loading states** during processing
- **Confirmation dialogs** for important actions

## 📋 Migration Steps

### **Database Updates**
1. Run migration to add cancellation fields
2. Create refunds table
3. Add indexes for performance
4. Set up RLS policies

### **Code Updates**
1. Update AdminOrderManagement component
2. Modify useAdminAnalytics hook
3. Update user Orders page
4. Add cancellation dialog component

## 🎯 Success Indicators

✅ **Admin Side**
- Cancellation dialog works properly
- Refund calculations are accurate
- Database updates successfully
- Analytics reflect changes immediately

✅ **User Side**
- Cancelled orders show properly
- Refund information is clear
- Status updates in real-time
- No broken links or errors

✅ **Analytics**
- Revenue calculations are correct
- Cancellation fees included
- Growth rates accurate
- Real-time updates working

## 🔄 Real-time Updates

The system automatically:
- Updates admin dashboard when orders cancelled
- Refreshes user order pages
- Adjusts revenue calculations
- Updates analytics in real-time
- Maintains data consistency

## 📊 Business Logic

### **Cancellation Policy**
- **90% refund** to customer
- **10% fee** retained by business
- **Reason required** for tracking
- **Immediate processing** of refunds

### **Revenue Impact**
- **Positive**: Cancellation fees add to revenue
- **Negative**: Full order amounts removed from revenue
- **Net**: 10% of cancelled order value retained

### **Customer Experience**
- **Transparent**: Clear breakdown of fees
- **Fair**: 90% refund policy
- **Informative**: Reason for cancellation provided
- **Timely**: Immediate status updates
