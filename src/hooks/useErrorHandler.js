import { useCallback } from 'react';
import { useError } from '../context/ErrorContext';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

/**
 * Custom hook for handling errors in components
 * @returns {Object} Error handling methods
 */
export function useErrorHandler() {
  const { addError, removeError, clearErrors, getErrorsBySeverity, getErrorsByCategory } = useError();

  /**
   * Handle an error with proper context and tracking
   * @param {Error|string} error - The error object or message
   * @param {string} context - The context where the error occurred
   * @param {ErrorSeverity} severity - The severity level of the error
   * @param {ErrorCategory} category - The category of the error
   * @param {Object} metadata - Additional metadata about the error
   */
  const handleError = useCallback((
    error,
    context,
    severity = ErrorSeverity.ERROR,
    category = ErrorCategory.UI,
    metadata = {}
  ) => {
    console.error(`[${context}] Error:`, error);
    
    // Create error message
    const message = error instanceof Error ? error.message : error;
    
    // Add stack trace for non-production environments
    const stack = process.env.NODE_ENV !== 'production' && error instanceof Error
      ? error.stack
      : undefined;

    // Track the error
    const errorId = addError(
      error,
      context,
      severity,
      category,
      {
        ...metadata,
        stack,
        timestamp: new Date().toISOString()
      }
    );

    // Return the error ID for reference
    return errorId;
  }, [addError]);

  /**
   * Handle an async operation with error handling
   * @param {Function} operation - The async operation to execute
   * @param {string} context - The context where the operation is being executed
   * @param {Object} options - Additional options for error handling
   * @returns {Promise} The result of the operation
   */
  const handleAsync = useCallback(async (
    operation,
    context,
    {
      severity = ErrorSeverity.ERROR,
      category = ErrorCategory.UI,
      metadata = {},
      rethrow = false
    } = {}
  ) => {
    try {
      return await operation();
    } catch (error) {
      const errorId = handleError(error, context, severity, category, metadata);
      
      if (rethrow) {
        error.errorId = errorId;
        throw error;
      }
      
      return { error, errorId };
    }
  }, [handleError]);

  /**
   * Create an error boundary handler for class components
   * @param {string} context - The context for the error boundary
   * @param {ErrorSeverity} severity - The severity level for caught errors
   * @returns {Object} Error boundary methods
   */
  const createErrorBoundaryHandler = useCallback((
    context,
    severity = ErrorSeverity.ERROR
  ) => ({
    getDerivedStateFromError: (error) => ({ hasError: true, error }),
    componentDidCatch: (error, errorInfo) => {
      handleError(
        error,
        context,
        severity,
        ErrorCategory.UI,
        { componentStack: errorInfo.componentStack }
      );
    }
  }), [handleError]);

  return {
    handleError,
    handleAsync,
    createErrorBoundaryHandler,
    removeError,
    clearErrors,
    getErrorsBySeverity,
    getErrorsByCategory
  };
} 