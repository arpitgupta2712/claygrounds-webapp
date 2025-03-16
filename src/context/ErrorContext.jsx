import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

// Initial state for error management
const initialState = {
  errors: [],
  lastError: null,
  hasUnreadErrors: false
};

// Action types for error state management
const ERROR_ACTIONS = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  MARK_ERRORS_READ: 'MARK_ERRORS_READ'
};

// Error reducer to handle state updates
function errorReducer(state, action) {
  switch (action.type) {
    case ERROR_ACTIONS.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload],
        lastError: action.payload,
        hasUnreadErrors: true
      };
    
    case ERROR_ACTIONS.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
        lastError: state.errors.length > 1 ? state.errors[state.errors.length - 2] : null
      };
    
    case ERROR_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
        lastError: null,
        hasUnreadErrors: false
      };
    
    case ERROR_ACTIONS.MARK_ERRORS_READ:
      return {
        ...state,
        hasUnreadErrors: false
      };
    
    default:
      return state;
  }
}

// Create the error context
const ErrorContext = createContext(null);

/**
 * Error Provider component for managing application-wide error state
 */
export function ErrorProvider({ children }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);
  const errorCounter = React.useRef(0);

  // Add a new error to the state
  const addError = useCallback((error, context, severity = ErrorSeverity.ERROR, category = ErrorCategory.UI) => {
    errorCounter.current += 1;
    const errorObject = {
      id: `${Date.now()}-${errorCounter.current}`,
      error: error instanceof Error ? error : new Error(error),
      message: error instanceof Error ? error.message : error,
      context,
      severity,
      category,
      timestamp: new Date(),
      stack: error instanceof Error ? error.stack : new Error().stack
    };

    dispatch({ type: ERROR_ACTIONS.ADD_ERROR, payload: errorObject });

    // Automatically clear non-critical errors after 5 seconds
    if (severity !== ErrorSeverity.CRITICAL) {
      setTimeout(() => {
        removeError(errorObject.id);
      }, 5000);
    }

    return errorObject.id;
  }, []);

  // Remove an error by ID
  const removeError = useCallback((errorId) => {
    dispatch({ type: ERROR_ACTIONS.REMOVE_ERROR, payload: errorId });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    dispatch({ type: ERROR_ACTIONS.CLEAR_ERRORS });
  }, []);

  // Mark all errors as read
  const markErrorsRead = useCallback(() => {
    dispatch({ type: ERROR_ACTIONS.MARK_ERRORS_READ });
  }, []);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity) => {
    return state.errors.filter(error => error.severity === severity);
  }, [state.errors]);

  // Get errors by category
  const getErrorsByCategory = useCallback((category) => {
    return state.errors.filter(error => error.category === category);
  }, [state.errors]);

  // Check if there are any critical errors
  const hasCriticalErrors = useCallback(() => {
    return state.errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  }, [state.errors]);

  const value = {
    ...state,
    addError,
    removeError,
    clearErrors,
    markErrorsRead,
    getErrorsBySeverity,
    getErrorsByCategory,
    hasCriticalErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook for accessing error context
 * @returns {Object} Error context value
 * @throws {Error} If used outside of ErrorProvider
 */
export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Error display component for showing current errors
export function ErrorDisplay() {
  const { errors, removeError } = useError();
  
  if (!errors.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map(error => (
        <div
          key={error.id}
          className={`p-4 rounded-lg shadow-lg border ${
            error.severity === ErrorSeverity.CRITICAL
              ? 'bg-error-light border-error'
              : error.severity === ErrorSeverity.WARNING
              ? 'bg-warning-light border-warning'
              : 'bg-info-light border-info'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">
                {error.context}
              </p>
              <p className="text-sm mt-1">
                {error.message}
              </p>
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 