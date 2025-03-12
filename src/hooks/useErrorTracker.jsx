import { useState, useCallback, useEffect } from 'react';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';
import { createPortal } from 'react-dom';
import { useToast } from './useToast';

// Global error store
const errorStore = {
  errors: [],
  maxErrors: 100,
  consoleLogging: true,
  criticalErrorCallback: null,
  
  getUserInfo() {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewPort: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct'
    };
  },
  
  getConsoleMethod(severity) {
    switch (severity) {
      case ErrorSeverity.INFO: return 'info';
      case ErrorSeverity.WARNING: return 'warn';
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  },
  
  init(options = {}) {
    console.log('[ErrorTracker] Initializing with options:', options);
    
    if (options.maxErrors !== undefined) this.maxErrors = options.maxErrors;
    if (options.consoleLogging !== undefined) this.consoleLogging = options.consoleLogging;
    if (options.criticalErrorCallback) this.criticalErrorCallback = options.criticalErrorCallback;
  }
};

// Setup global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    trackErrorGlobal(
      error,
      'global',
      ErrorSeverity.ERROR,
      ErrorCategory.UI
    );
    return false; // Don't prevent default error handling
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason || new Error('Unhandled Promise rejection');
    trackErrorGlobal(
      error,
      'promise',
      ErrorSeverity.ERROR,
      ErrorCategory.UI
    );
    return false; // Don't prevent default error handling
  });
}

// Global track error function
function trackErrorGlobal(error, context, severity, category, metadata = {}) {
  // Create error object if string was passed
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  const errorInfo = {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date(),
    message: errorObj.message || 'Unknown error',
    stack: errorObj.stack,
    context,
    severity,
    category,
    metadata,
    userInfo: errorStore.getUserInfo()
  };

  // Console logging if enabled
  if (errorStore.consoleLogging) {
    const consoleMethod = errorStore.getConsoleMethod(severity);
    console.groupCollapsed(`[${context}][${severity}][${category}] ${errorInfo.message}`);
    console[consoleMethod]('Error details:', errorInfo);
    console.groupEnd();
  }
  
  // Add to error history
  errorStore.errors.unshift(errorInfo);
  
  // Maintain max size
  if (errorStore.errors.length > errorStore.maxErrors) {
    errorStore.errors.pop();
  }

  // Handle critical errors
  if (severity === ErrorSeverity.CRITICAL && errorStore.criticalErrorCallback) {
    try {
      errorStore.criticalErrorCallback(errorInfo);
    } catch (callbackError) {
      console.error('[ErrorTracker] Error in critical error callback:', callbackError);
    }
  }

  return errorInfo;
}

// React component for error UI
export function ErrorMessage({ error, onClose }) {
  if (!error) return null;
  
  // Customize message based on severity
  let errorTitle = 'Notice';
  if (error.severity === ErrorSeverity.WARNING) errorTitle = 'Warning';
  if (error.severity === ErrorSeverity.ERROR) errorTitle = 'Error';
  if (error.severity === ErrorSeverity.CRITICAL) errorTitle = 'Critical Error';
  
  const bgColor = {
    info: 'bg-info-light text-info-600',
    warning: 'bg-warning-light text-warning-600',
    error: 'bg-error-light text-error',
    critical: 'bg-error-light text-error'
  }[error.severity] || 'bg-info-light text-info';
  
  const borderColor = {
    info: 'border-l-info',
    warning: 'border-l-warning',
    error: 'border-l-error',
    critical: 'border-l-error'
  }[error.severity] || 'border-l-info';
  
  return createPortal(
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${bgColor} p-4 rounded shadow-md border-l-4 ${borderColor} animate-fadeIn`}>
      <div className="flex justify-between">
        <h3 className="font-semibold">{errorTitle}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      <p className="mb-2">{error.message}</p>
      <small className="text-xs opacity-75">
        {error.context} (ID: {error.id.substring(0, 8)})
      </small>
      
      {(error.category === ErrorCategory.NETWORK || error.category === ErrorCategory.DATA) && (
        <button 
          className="mt-2 px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-light"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      )}
    </div>,
    document.body
  );
}

// Custom hook for error tracking
export function useErrorTracker() {
  const [visibleError, setVisibleError] = useState(null);
  const { showToast } = useToast();
  
  // Handle error display
  const displayError = useCallback((errorInfo) => {
    if (errorInfo.severity === ErrorSeverity.INFO) {
      showToast(errorInfo.message, 'info');
    } else if (errorInfo.severity === ErrorSeverity.WARNING) {
      showToast(errorInfo.message, 'warning');
    } else {
      setVisibleError(errorInfo);
      
      // Auto-dismiss after 8 seconds for non-critical errors
      if (errorInfo.severity !== ErrorSeverity.CRITICAL) {
        setTimeout(() => {
          setVisibleError(null);
        }, 8000);
      }
    }
  }, [showToast]);
  
  // Track error function
  const trackError = useCallback((error, context, severity, category, metadata = {}) => {
    const errorInfo = trackErrorGlobal(error, context, severity, category, metadata);
    
    // Display significant errors to user
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      displayError(errorInfo);
    }
    
    return errorInfo;
  }, [displayError]);
  
  // Cleanup handler
  const closeError = useCallback(() => {
    setVisibleError(null);
  }, []);
  
  // Initialize error tracker on mount
  useEffect(() => {
    errorStore.init({
      maxErrors: 100,
      consoleLogging: true,
      criticalErrorCallback: (errorInfo) => {
        console.error('[ErrorTracker] Critical error:', errorInfo);
        displayError(errorInfo);
      }
    });
    
    return () => {
      // No cleanup needed
    };
  }, [displayError]);
  
  return { 
    trackError,
    errors: errorStore.errors,
    visibleError,
    closeError
  };
}

// Error component to render
export function ErrorDisplay() {
  const { visibleError, closeError } = useErrorTracker();
  
  if (!visibleError) return null;
  
  return <ErrorMessage error={visibleError} onClose={closeError} />;
}