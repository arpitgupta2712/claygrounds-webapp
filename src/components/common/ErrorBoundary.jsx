import { Component } from 'react';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Track error if window.trackError exists (from ErrorTracker)
    if (typeof window.trackError === 'function') {
      window.trackError(
        error,
        'ErrorBoundary',
        ErrorSeverity.CRITICAL,
        ErrorCategory.UI,
        { componentStack: errorInfo.componentStack }
      );
    }
  }
  
  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border-l-4 border-error">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-error-light text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-center mb-4">Something went wrong</h2>
            
            <div className="mb-4 text-text-medium">
              <p className="mb-2">We're sorry, but an error occurred while rendering this page.</p>
              {this.state.error && (
                <div className="p-3 bg-gray-100 rounded-md overflow-auto mb-3">
                  <p className="font-mono text-sm text-error">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white rounded transition-colors"
              >
                Reload Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-white border border-primary text-primary hover:bg-primary-light hover:text-white rounded transition-colors"
              >
                Try Again
              </button>
              
              <a
                href="/"
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-center text-gray-800 rounded transition-colors"
              >
                Go to Home Page
              </a>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="mt-6">
                <p className="font-semibold mb-2 text-gray-600">Component Stack:</p>
                <pre className="p-3 bg-gray-100 rounded-md overflow-auto text-xs text-gray-700 max-h-60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;