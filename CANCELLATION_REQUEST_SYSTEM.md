# Cancellation Request System Guide

## 🎯 Overview
This guide explains the new cancellation request system where users can request order cancellation and admins can accept or reject these requests.

## 🔧 How It Works

### **User Side Process**
1. **User requests cancellation** for pending/processing orders
2. **System updates** order status to "cancellation_requested"
3. **User waits** for admin response
4. **Admin reviews** and accepts/rejects request
5. **User gets notified** of the decision

### **Admin Side Process**
1. **Admin sees** cancellation requests in order management
2. **Admin reviews** customer's reason for cancellation
3. **Admin decides** to accept or reject
4. **If accepted**: 90% refund + 10% fee, order cancelled
5. **If rejected**: Order continues processing

## 📊 Database Schema

### **Orders Table Updates**
```sql
-- New fields for cancellation requests
cancellation_requested BOOLEAN DEFAULT false,           -- Has user requested cancellation?
cancellation_request_reason TEXT,                       -- User's reason for cancellation
cancellation_requested_at TIMESTAMP WITH TIME ZONE,     -- When request was made
admin_response TEXT,                                    -- Admin's response to request
```

### **Order Status Flow**
```
pending/processing → cancellation_requested → cancelled (if accepted)
pending/processing → cancellation_requested → processing (if rejected)
```

## 🎛️ User Side Features

### **Cancellation Request Button**
- **Available for**: Pending and processing orders
- **Not available for**: Already cancelled, delivered, or shipped orders
- **One-time request**: Can't request cancellation multiple times

### **Request Dialog**
- **Policy explanation**: Clear explanation of what happens
- **Reason required**: User must provide cancellation reason
- **Confirmation**: User confirms before sending request

### **Status Display**
- **Cancellation Requested**: Orange badge with warning icon
- **Request Pending**: Shows "Admin will review your request"
- **Request Rejected**: Shows "Your order is now being processed"
- **Cancelled**: Shows refund and fee information

## 👨‍💼 Admin Side Features

### **Order Management**
- **Cancellation requests** highlighted in order list
- **Review button** for pending requests
- **Customer reason** clearly displayed
- **Accept/Reject** options with admin response

### **Review Dialog**
- **Customer reason** prominently displayed
- **Admin response** field (optional)
- **Accept button**: Processes cancellation with refund
- **Reject button**: Returns order to processing

### **Status Updates**
- **Accept**: Order → cancelled, 90% refund, 10% fee
- **Reject**: Order → processing, no refund

## 🔄 Workflow

### **User Requests Cancellation**
```
1. User clicks "Request Cancellation"
2. User provides reason (required)
3. System updates order status to "cancellation_requested"
4. User sees "Request Pending" status
5. Admin gets notified of new request
```

### **Admin Reviews Request**
```
1. Admin sees request in order management
2. Admin clicks "Review Request"
3. Admin sees customer's reason
4. Admin can add response (optional)
5. Admin clicks "Accept" or "Reject"
```

### **System Processes Decision**
```
If Accepted:
- Order status → cancelled
- Payment status → refunded
- 90% refund calculated
- 10% fee retained
- Refund record created

If Rejected:
- Order status → processing
- No refund processed
- Order continues normally
```

## 📈 Status Flow Diagram

```
[Pending/Processing] 
        ↓
[User Requests Cancellation]
        ↓
[Cancellation Requested]
        ↓
    ↙️     ↘️
[Accepted]  [Rejected]
    ↓         ↓
[Cancelled] [Processing]
    ↓         ↓
[90% Refund] [Continue Processing]
[10% Fee]
```

## 🛠️ Technical Implementation

### **User Side (Orders.tsx)**
```typescript
// Cancel order request mutation
const cancelOrderRequestMutation = useMutation({
  mutationFn: async ({ orderId, reason }) => {
    await supabase.from('orders').update({
      cancellation_requested: true,
      cancellation_request_reason: reason,
      cancellation_requested_at: new Date().toISOString(),
      status: 'cancellation_requested'
    });
  }
});

// Check if user can request cancellation
const canRequestCancellation = (order) => {
  return ['pending', 'processing'].includes(order.status) && 
         !order.cancellation_requested;
};
```

### **Admin Side (AdminOrderManagement.tsx)**
```typescript
// Handle cancellation request
const handleCancellationRequestMutation = useMutation({
  mutationFn: async ({ orderId, action, adminResponse }) => {
    if (action === 'accept') {
      // Process cancellation with refund
      const orderAmount = parseFloat(order.total_amount);
      const cancellationFee = orderAmount * 0.10;
      const refundAmount = orderAmount * 0.90;
      
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_status: 'refunded',
        cancellation_fee: cancellationFee,
        refund_amount: refundAmount,
        admin_response: adminResponse
      });
    } else {
      // Reject request
      await supabase.from('orders').update({
        status: 'processing',
        admin_response: adminResponse
      });
    }
  }
});
```

## 🎨 UI Components

### **User Side**
- **Request Button**: Red outline button for cancellation requests
- **Status Badge**: Orange for requested, gray for rejected
- **Info Box**: Shows request status and admin response
- **Dialog**: Policy explanation and reason input

### **Admin Side**
- **Review Button**: Highlighted button for pending requests
- **Status Badge**: Red for requested, normal for others
- **Review Dialog**: Customer reason and admin response fields
- **Action Buttons**: Accept (red) and Reject (gray) buttons

## 📊 Business Logic

### **Cancellation Policy**
- **Request required**: Users can't cancel directly
- **Admin review**: All requests reviewed by admin
- **Acceptance criteria**: Admin decides based on business rules
- **Refund policy**: 90% refund, 10% fee if accepted

### **Status Rules**
- **Can request**: Only pending and processing orders
- **One request**: Only one cancellation request per order
- **No duplicate**: Can't request if already requested
- **Final decision**: Admin's decision is final

## 🔍 Error Handling

### **Validation**
- **Reason required**: User must provide cancellation reason
- **Status validation**: Only valid orders can request cancellation
- **Duplicate prevention**: Can't request multiple times
- **Admin response**: Optional but recommended

### **User Feedback**
- **Success messages**: Request sent successfully
- **Error messages**: Failed to send request
- **Status updates**: Real-time status changes
- **Clear information**: What happens next

## 📋 Migration Steps

### **Database Updates**
1. Run migration to add cancellation request fields
2. Update existing orders if needed
3. Test with sample data

### **Code Updates**
1. Update user Orders page with request functionality
2. Update admin OrderManagement with review functionality
3. Add new status handling throughout the app
4. Test complete workflow

## 🎯 Success Indicators

✅ **User Side**
- Can request cancellation for valid orders
- Sees clear status updates
- Gets proper feedback for actions
- Can't request multiple times

✅ **Admin Side**
- Sees cancellation requests clearly
- Can review and respond to requests
- Proper refund processing on acceptance
- Order continues on rejection

✅ **System**
- Status transitions work correctly
- Refund calculations are accurate
- Database updates properly
- Real-time updates work

## 🔄 Real-time Updates

The system automatically:
- Updates user order status when request sent
- Shows admin new cancellation requests
- Updates status when admin responds
- Refreshes analytics after decisions
- Maintains data consistency

## 📊 Benefits

### **For Users**
- **Transparent process**: Clear cancellation policy
- **Fair treatment**: Admin review ensures fairness
- **Better experience**: Can request cancellation easily
- **Clear communication**: Know what happens next

### **For Business**
- **Control**: Admin controls all cancellations
- **Prevention**: Reduces unnecessary cancellations
- **Revenue protection**: 10% fee on accepted cancellations
- **Better tracking**: All requests logged and tracked

### **For System**
- **Audit trail**: Complete history of requests
- **Data integrity**: Proper status management
- **Scalability**: Handles multiple requests efficiently
- **Flexibility**: Easy to modify policies
