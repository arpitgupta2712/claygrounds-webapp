import React from 'react';
import PropTypes from 'prop-types';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { useErrorHandler } from '../../hooks/useErrorHandler';

/**
 * Error Boundary component to catch and handle React rendering errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Track error using our error tracking system
    this.props.onError?.(error, {
      componentStack: errorInfo.componentStack,
      ...this.props.metadata
    });
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      return fallback ? fallback(error) : (
        <div className="p-4 bg-error-light border border-error rounded-md">
          <h3 className="text-lg font-semibold text-error mb-2">Something went wrong</h3>
          <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  metadata: PropTypes.object
};

/**
 * HOC to wrap components with error boundary
 */
function withErrorBoundary(WrappedComponent, options = {}) {
  const WithErrorBoundary = (props) => {
    const { handleError } = useErrorHandler();
    
    const handleBoundaryError = (error, errorInfo) => {
      handleError(
        error,
        options.context || WrappedComponent.name,
        ErrorSeverity.ERROR,
        ErrorCategory.UI,
        { 
          componentStack: errorInfo.componentStack,
          ...options.metadata,
          ...errorInfo
        }
      );
      options.onError?.(error, errorInfo);
    };

    return (
      <ErrorBoundary
        fallback={options.fallback}
        onError={handleBoundaryError}
        metadata={options.metadata}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithErrorBoundary;
}

export { ErrorBoundary, withErrorBoundary };