import { toast } from 'sonner';
import { envLog } from './env-config';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Enhanced error handler for API responses
export const handleApiError = (error: any, context?: string): ApiError => {
  let apiError: ApiError = {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR'
  };

  if (error?.response) {
    // Axios error with response
    const { status, data } = error.response;
    apiError = {
      message: data?.message || `HTTP ${status} Error`,
      status,
      code: data?.code || `HTTP_${status}`,
      details: data
    };
  } else if (error?.request) {
    // Network error
    apiError = {
      message: 'Network error - please check your connection',
      status: 0,
      code: 'NETWORK_ERROR',
      details: error.request
    };
  } else if (error instanceof Error) {
    // JavaScript error
    apiError = {
      message: error.message,
      code: 'JS_ERROR',
      details: error.stack
    };
  } else if (typeof error === 'string') {
    // String error
    apiError = {
      message: error,
      code: 'STRING_ERROR'
    };
  }

  // Log the error with context
  envLog.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details
  });

  return apiError;
};

// Show user-friendly error messages
export const showErrorToast = (error: any, context?: string, fallbackMessage?: string) => {
  const apiError = handleApiError(error, context);
  
  // Determine user-friendly message
  let userMessage = apiError.message;
  
  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'HTTP_401': 'Please sign in to continue',
    'HTTP_403': 'You don\'t have permission to perform this action',
    'HTTP_404': 'The requested resource was not found',
    'HTTP_429': 'Too many requests. Please try again later',
    'HTTP_500': 'Server error. Please try again later',
    'NETWORK_ERROR': 'Connection failed. Please check your internet connection',
    'TIMEOUT_ERROR': 'Request timed out. Please try again'
  };

  if (apiError.code && errorMessages[apiError.code]) {
    userMessage = errorMessages[apiError.code];
  } else if (fallbackMessage) {
    userMessage = fallbackMessage;
  }

  // Show toast with appropriate styling
  if (apiError.status === 401) {
    toast.error(userMessage, {
      description: 'Redirecting to sign in...',
      duration: 3000
    });
    
    // Trigger logout after a delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('force-logout'));
    }, 1000);
  } else if (apiError.status && apiError.status >= 500) {
    toast.error(userMessage, {
      description: 'Our team has been notified',
      duration: 5000
    });
  } else {
    toast.error(userMessage, {
      duration: 4000
    });
  }

  return apiError;
};

// Retry mechanism for failed requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      envLog.debug(`Attempting operation${context ? ` (${context})` : ''} - attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403 || (error as any)?.response?.status === 404) {
        throw error;
      }

      if (attempt < maxRetries) {
        envLog.warn(`Operation failed${context ? ` (${context})` : ''}, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  envLog.error(`Operation failed${context ? ` (${context})` : ''} after ${maxRetries} attempts`, lastError);
  throw lastError;
};

// Global error boundary handler
export const handleGlobalError = (error: Error, errorInfo?: any) => {
  envLog.error('Global error caught:', {
    message: error.message,
    stack: error.stack,
    errorInfo
  });

  // Report to error tracking service in production
  if (import.meta.env.PROD) {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    console.error('Production error:', error);
  }

  // Show user-friendly message
  toast.error('Something went wrong', {
    description: 'Please refresh the page and try again',
    duration: 5000
  });
};

// Validation error handler
export const handleValidationErrors = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');

  toast.error('Validation failed', {
    description: errorMessages,
    duration: 6000
  });

  envLog.warn('Validation errors:', errors);
};

// Network status handler
export const handleNetworkStatus = () => {
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      toast.success('Connection restored', {
        duration: 2000
      });
      envLog.info('Network connection restored');
    } else {
      toast.error('Connection lost', {
        description: 'Please check your internet connection',
        duration: 0 // Keep until dismissed
      });
      envLog.warn('Network connection lost');
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }
};

// Error recovery utilities
export const recoverFromError = {
  // Refresh current page data
  refreshPage: () => {
    window.location.reload();
  },

  // Navigate to safe route
  navigateToSafe: (route: string = '/dashboard') => {
    window.location.href = route;
  },

  // Clear local storage and restart
  clearAndRestart: () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/sign-in';
  },

  // Retry last action
  retryLastAction: (action: () => void) => {
    try {
      action();
    } catch (error) {
      envLog.error('Failed to retry last action:', error);
      toast.error('Retry failed. Please try again manually.');
    }
  }
};