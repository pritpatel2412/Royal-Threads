// Comprehensive error handling utility
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

export const handleSupabaseError = (error: any, context: string = 'Unknown operation') => {
  console.error(`Supabase Error in ${context}:`, error);
  
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new AppError('This record already exists', 'DUPLICATE_ENTRY', 409);
      case '23503': // Foreign key violation
        return new AppError('Related record not found', 'FOREIGN_KEY_VIOLATION', 400);
      case '42P01': // Table doesn't exist
        return new AppError('Database table not found', 'TABLE_NOT_FOUND', 500);
      case '42703': // Column doesn't exist
        return new AppError('Database column not found', 'COLUMN_NOT_FOUND', 500);
      case '42501': // Insufficient privilege
        return new AppError('Insufficient permissions', 'INSUFFICIENT_PRIVILEGE', 403);
      default:
        return new AppError(
          error.message || 'Database operation failed',
          'DATABASE_ERROR',
          500
        );
    }
  }
  
  return new AppError(
    error?.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  );
};

export const handleNetworkError = (error: any, context: string = 'Network request') => {
  console.error(`Network Error in ${context}:`, error);
  
  if (error?.code === 'NETWORK_ERROR') {
    return new AppError('Network connection failed', 'NETWORK_ERROR', 503);
  }
  
  if (error?.status) {
    switch (error.status) {
      case 401:
        return new AppError('Authentication required', 'UNAUTHORIZED', 401);
      case 403:
        return new AppError('Access forbidden', 'FORBIDDEN', 403);
      case 404:
        return new AppError('Resource not found', 'NOT_FOUND', 404);
      case 429:
        return new AppError('Too many requests', 'RATE_LIMITED', 429);
      case 500:
        return new AppError('Server error', 'SERVER_ERROR', 500);
      default:
        return new AppError(
          error.message || 'Request failed',
          'REQUEST_ERROR',
          error.status
        );
    }
  }
  
  return new AppError(
    error?.message || 'Network request failed',
    'NETWORK_ERROR',
    500
  );
};

export const handleValidationError = (errors: any[], context: string = 'Validation') => {
  console.error(`Validation Error in ${context}:`, errors);
  
  const errorMessages = errors.map(err => err.message).join(', ');
  return new AppError(
    `Validation failed: ${errorMessages}`,
    'VALIDATION_ERROR',
    400
  );
};

export const handleImageError = (error: any, context: string = 'Image operation') => {
  console.error(`Image Error in ${context}:`, error);
  
  if (error?.code === 'FILE_TOO_LARGE') {
    return new AppError('Image file is too large', 'FILE_TOO_LARGE', 400);
  }
  
  if (error?.code === 'INVALID_FILE_TYPE') {
    return new AppError('Invalid image file type', 'INVALID_FILE_TYPE', 400);
  }
  
  return new AppError(
    error?.message || 'Image operation failed',
    'IMAGE_ERROR',
    500
  );
};

export const handleOrderError = (error: any, context: string = 'Order operation') => {
  console.error(`Order Error in ${context}:`, error);
  
  if (error?.code === 'ORDER_NOT_FOUND') {
    return new AppError('Order not found', 'ORDER_NOT_FOUND', 404);
  }
  
  if (error?.code === 'ORDER_ALREADY_CANCELLED') {
    return new AppError('Order is already cancelled', 'ORDER_ALREADY_CANCELLED', 400);
  }
  
  if (error?.code === 'ORDER_CANNOT_BE_CANCELLED') {
    return new AppError('Order cannot be cancelled at this stage', 'ORDER_CANNOT_BE_CANCELLED', 400);
  }
  
  return new AppError(
    error?.message || 'Order operation failed',
    'ORDER_ERROR',
    500
  );
};

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
  
  // In production, you might want to send this to a logging service
  // like Sentry, LogRocket, or your own logging endpoint
};

export const showErrorToast = (error: any, toast: any) => {
  const errorMessage = error instanceof AppError 
    ? error.message 
    : 'An unexpected error occurred';
    
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

export const isOperationalError = (error: any) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Error boundary helper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string = 'Function'
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  };
};
