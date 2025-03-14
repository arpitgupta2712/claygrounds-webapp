import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

class ErrorService {
  constructor() {
    this.errorHandlers = new Map();
    this.errorListeners = new Set();
    this.defaultHandler = this.defaultErrorHandler.bind(this);
  }

  /**
   * Register an error handler for a specific error category
   * @param {string} category - Error category to handle
   * @param {Function} handler - Handler function
   */
  registerHandler(category, handler) {
    this.errorHandlers.set(category, handler);
  }

  /**
   * Subscribe to error events
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Notify all error listeners
   * @param {Object} error - Error object
   */
  notifyListeners(error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('[ErrorService] Error in listener:', err);
      }
    });
  }

  /**
   * Default error handler
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  defaultErrorHandler(error, context) {
    console.error(`[ErrorService] Unhandled ${context.category} error:`, error);
    this.notifyListeners({ error, context });
  }

  /**
   * Handle an error with appropriate handler
   * @param {Error} error - Error object
   * @param {string} category - Error category
   * @param {string} severity - Error severity
   * @param {Object} metadata - Additional error metadata
   */
  handleError(error, category = ErrorCategory.UI, severity = ErrorSeverity.ERROR, metadata = {}) {
    const errorContext = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      category,
      severity,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    const handler = this.errorHandlers.get(category) || this.defaultHandler;
    
    try {
      handler(error, errorContext);
    } catch (handlerError) {
      console.error('[ErrorService] Error in error handler:', handlerError);
      this.defaultHandler(error, errorContext);
    }

    return errorContext;
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {Object} requestInfo - Request information
   */
  handleNetworkError(error, requestInfo = {}) {
    return this.handleError(error, ErrorCategory.NETWORK, ErrorSeverity.ERROR, {
      ...requestInfo,
      status: error.status,
      statusText: error.statusText
    });
  }

  /**
   * Handle API errors
   * @param {Error} error - API error
   * @param {Object} apiContext - API context
   */
  handleApiError(error, apiContext = {}) {
    const severity = error.status >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING;
    return this.handleError(error, ErrorCategory.DATA, severity, apiContext);
  }

  /**
   * Handle validation errors
   * @param {Object} validationErrors - Validation errors
   * @param {string} formId - Form identifier
   */
  handleValidationError(validationErrors, formId) {
    return this.handleError(
      new Error('Validation failed'),
      ErrorCategory.VALIDATION,
      ErrorSeverity.WARNING,
      { validationErrors, formId }
    );
  }

  /**
   * Format error message for display
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {string} Formatted error message
   */
  formatErrorMessage(error, context = {}) {
    if (context.category === ErrorCategory.NETWORK) {
      return 'Network error occurred. Please check your connection and try again.';
    }

    if (context.category === ErrorCategory.DATA) {
      return 'Error loading data. Please try again later.';
    }

    if (context.category === ErrorCategory.VALIDATION) {
      return 'Please check the form for errors and try again.';
    }

    if (context.category === ErrorCategory.AUTH) {
      return 'Authentication error. Please log in again.';
    }

    return error.message || 'An unexpected error occurred.';
  }
}

// Create and export singleton instance
export const errorService = new ErrorService();

// Register default handlers
errorService.registerHandler(ErrorCategory.AUTH, (error, context) => {
  if (error.status === 401) {
    // Handle unauthorized
    window.location.href = '/login';
  }
});

errorService.registerHandler(ErrorCategory.NETWORK, (error, context) => {
  // Retry failed requests
  if (context.metadata.retryCount < 3) {
    setTimeout(() => {
      // Implement retry logic
    }, Math.pow(2, context.metadata.retryCount) * 1000);
  }
}); 