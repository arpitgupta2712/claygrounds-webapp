import { useState, useCallback, useEffect } from 'react';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';
import { createPortal } from 'react-dom';
import { useToast } from './useToast';

// Global error store with enhanced functionality
const errorStore = {
  errors: [],
  maxErrors: 100,
  consoleLogging: true,
  criticalErrorCallback: null,
  errorSubscribers: new Set(),
  errorAggregates: new Map(), // Store error aggregates
  
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

  // New method to aggregate similar errors
  aggregateError(errorInfo) {
    const key = `${errorInfo.message}:${errorInfo.context}:${errorInfo.category}`;
    const existing = this.errorAggregates.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = errorInfo.timestamp;
      existing.occurrences.push(errorInfo.timestamp);
      
      // Keep only last 10 occurrences
      if (existing.occurrences.length > 10) {
        existing.occurrences.shift();
      }
      
      // Calculate frequency (errors per hour)
      const hourInMs = 60 * 60 * 1000;
      const now = new Date().getTime();
      const recentOccurrences = existing.occurrences.filter(
        time => (now - new Date(time).getTime()) <= hourInMs
      );
      existing.frequency = recentOccurrences.length;
      
      this.errorAggregates.set(key, existing);
      return existing;
    } else {
      const newAggregate = {
        id: errorInfo.id,
        message: errorInfo.message,
        context: errorInfo.context,
        category: errorInfo.category,
        severity: errorInfo.severity,
        firstOccurrence: errorInfo.timestamp,
        lastOccurrence: errorInfo.timestamp,
        occurrences: [errorInfo.timestamp],
        count: 1,
        frequency: 1
      };
      this.errorAggregates.set(key, newAggregate);
      return newAggregate;
    }
  },
  
  // New method to check if error rate is concerning
  isErrorRateConcerning(aggregate) {
    // Alert if more than 10 errors of same type per hour
    return aggregate.frequency >= 10;
  },
  
  init(options = {}) {
    console.log('[ErrorTracker] Initializing with options:', options);
    
    if (options.maxErrors !== undefined) this.maxErrors = options.maxErrors;
    if (options.consoleLogging !== undefined) this.consoleLogging = options.consoleLogging;
    if (options.criticalErrorCallback) this.criticalErrorCallback = options.criticalErrorCallback;
  },

  // New method to subscribe to error updates
  subscribe(callback) {
    this.errorSubscribers.add(callback);
    return () => this.errorSubscribers.delete(callback);
  },

  // New method to notify subscribers
  notifySubscribers(errorInfo) {
    this.errorSubscribers.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (error) {
        console.error('[ErrorTracker] Error in subscriber callback:', error);
      }
    });
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
    return false;
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason || new Error('Unhandled Promise rejection');
    trackErrorGlobal(
      error,
      'promise',
      ErrorSeverity.ERROR,
      ErrorCategory.UI
    );
    return false;
  });
}

// Global track error function with enhanced aggregation
function trackErrorGlobal(error, context, severity, category, metadata = {}) {
  // Handle null errors (used for logging non-error events)
  if (!error && severity === ErrorSeverity.INFO) {
    const errorInfo = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      message: metadata.message || 'Info event',
      stack: null,
      context,
      severity,
      category,
      metadata,
      userInfo: errorStore.getUserInfo()
    };

    if (errorStore.consoleLogging) {
      console.groupCollapsed(`[${context}][${severity}][${category}] ${errorInfo.message}`);
      console.info('Event details:', errorInfo);
      console.groupEnd();
    }

    return errorInfo;
  }

  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  const errorInfo = {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date(),
    message: errorObj?.message || 'Unknown error',
    stack: errorObj?.stack,
    context,
    severity,
    category,
    metadata,
    userInfo: errorStore.getUserInfo()
  };

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

  // Aggregate error and check frequency
  const aggregate = errorStore.aggregateError(errorInfo);
  
  // Handle critical errors and high-frequency errors
  if (severity === ErrorSeverity.CRITICAL || errorStore.isErrorRateConcerning(aggregate)) {
    try {
      errorStore.criticalErrorCallback?.(errorInfo, aggregate);
    } catch (callbackError) {
      console.error('[ErrorTracker] Error in critical error callback:', callbackError);
    }
  }

  // Notify subscribers
  errorStore.notifySubscribers(errorInfo);

  return errorInfo;
}

// React component for error UI
export function ErrorMessage({ error, onClose }) {
  if (!error) return null;
  
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

// Enhanced useErrorTracker hook
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
      criticalErrorCallback: (errorInfo, aggregate) => {
        console.error('[ErrorTracker] Critical/High-Frequency error:', errorInfo);
        console.error('Error aggregate:', aggregate);
        displayError({
          ...errorInfo,
          message: aggregate.count > 1 
            ? `${errorInfo.message} (Occurred ${aggregate.count} times in the last hour)`
            : errorInfo.message
        });
      }
    });
  }, [displayError]);
  
  return { 
    trackError,
    errors: errorStore.errors,
    errorAggregates: Array.from(errorStore.errorAggregates.values()),
    visibleError,
    closeError,
    subscribe: errorStore.subscribe.bind(errorStore)
  };
}

// Error component to render
export function ErrorDisplay() {
  const { visibleError, closeError } = useErrorTracker();
  
  if (!visibleError) return null;
  
  return <ErrorMessage error={visibleError} onClose={closeError} />;
}