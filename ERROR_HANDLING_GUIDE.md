# Error Handling Guide

## Overview
This guide covers all the error handling mechanisms implemented in the Indian Groom Elegance project.

## 1. Error Handling Utilities (`src/utils/errorHandler.ts`)

### AppError Class
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Error Handlers

#### Supabase Errors
- **23505**: Unique violation - "This record already exists"
- **23503**: Foreign key violation - "Related record not found"
- **42P01**: Table doesn't exist - "Database table not found"
- **42703**: Column doesn't exist - "Database column not found"
- **42501**: Insufficient privilege - "Insufficient permissions"

#### Network Errors
- **401**: Authentication required
- **403**: Access forbidden
- **404**: Resource not found
- **429**: Too many requests
- **500**: Server error

#### Validation Errors
- Handles form validation errors
- Combines multiple error messages

#### Image Errors
- File too large
- Invalid file type
- Upload failures

#### Order Errors
- Order not found
- Order already cancelled
- Order cannot be cancelled at this stage

## 2. Implementation in Components

### Orders.tsx
```typescript
// Error handling in queries
const { data: orders, isLoading, error: ordersError } = useQuery({
  queryKey: ['orders', user?.id],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) {
        const appError = handleSupabaseError(error, 'Fetching orders');
        throw appError;
      }
      return data;
    } catch (error) {
      logError(error, 'Orders query');
      throw error;
    }
  },
  retry: (failureCount, error) => {
    if ((error as any)?.statusCode === 401) return false;
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Error display
{ordersError ? (
  <div className="text-center py-20">
    <X className="h-24 w-24 text-red-300 mx-auto mb-6" />
    <h3 className="text-2xl font-serif font-bold text-red-800 mb-4">
      Error Loading Orders
    </h3>
    <p className="text-red-600 mb-8 max-w-md mx-auto">
      {ordersError instanceof Error ? ordersError.message : 'Failed to load your orders'}
    </p>
    <Button onClick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
) : null}
```

### AdminOrderManagement.tsx
```typescript
// Error handling in mutations
const cancelOrderMutation = useMutation({
  mutationFn: async ({ orderId, reason }) => {
    try {
      const { error } = await supabase.from('orders').update({...});
      if (error) {
        const appError = handleSupabaseError(error, 'Cancelling order');
        throw appError;
      }
    } catch (error) {
      logError(error, 'Order cancellation');
      throw error;
    }
  },
  onError: (error) => {
    showErrorToast(error, toast);
  },
});
```

## 3. Database Migration Status

### Current Issues
- Supabase CLI login failed due to access token format
- Database schema needs updates for cancellation fields
- TypeScript types need to be regenerated

### Required Database Changes
```sql
-- Add cancellation and refund fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Create refunds table
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

## 4. Temporary Workarounds

### Type Assertions
```typescript
// For database fields that don't exist yet
status: 'cancelled' as any
```

### Simplified Error Handling
```typescript
// Catch and log errors without breaking the app
try {
  await supabase.from('refunds').insert([...]);
} catch (logError) {
  console.warn('Failed to log status change:', logError);
}
```

## 5. Error Recovery Strategies

### Retry Logic
- Exponential backoff for network requests
- Maximum 3 retries
- No retry for authentication errors

### Fallback Mechanisms
- Placeholder images for missing product images
- Default values for missing data
- Graceful degradation of features

### User Feedback
- Toast notifications for errors
- Loading states during operations
- Clear error messages with actionable steps

## 6. Monitoring and Logging

### Error Logging
```typescript
export const logError = (error: any, context: string = 'Application') => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    }
  };
  
  console.error('Error Log:', errorInfo);
};
```

### Performance Monitoring
- Query retry delays
- Loading states
- Error frequency tracking

## 7. Best Practices

### Error Boundaries
- Wrap components in error boundaries
- Provide fallback UI for component errors
- Log errors for debugging

### User Experience
- Show loading states during operations
- Provide clear error messages
- Offer retry options where appropriate
- Don't break the entire app for non-critical errors

### Development
- Use TypeScript for type safety
- Implement proper error handling in all async operations
- Test error scenarios
- Monitor error logs in production

## 8. Next Steps

1. **Fix Supabase CLI Access**: Get proper access token format
2. **Run Database Migration**: Apply the SQL changes to add cancellation fields
3. **Regenerate Types**: Update TypeScript types after database changes
4. **Implement Full Cancellation Flow**: Add user-initiated cancellation requests
5. **Add Error Monitoring**: Integrate with error tracking service (Sentry, etc.)
6. **Test Error Scenarios**: Comprehensive testing of all error paths

## 9. Current Status

✅ **Completed**:
- Basic error handling utilities
- Error display in Orders component
- Retry logic for failed requests
- Loading states and error boundaries

⚠️ **In Progress**:
- Database migration for cancellation fields
- Full cancellation request flow
- TypeScript type updates

❌ **Pending**:
- Supabase CLI access token setup
- Production error monitoring
- Comprehensive error testing
