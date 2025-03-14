import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import Loading from '../common/Loading';

/**
 * Login page component with Google Sign-In
 */
function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, session, signInWithGoogle, devSignIn, isDevelopment } = useAuth();
  const { trackError } = useErrorTracker();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard or the page they came from
  useEffect(() => {
    if (user || session) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('[LoginPage] User authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [user, session, navigate, location]);

  /**
   * Handle Google sign in
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[LoginPage] Starting Google sign-in process');
      await signInWithGoogle();
      
      // Navigation handled by useEffect above
    } catch (error) {
      console.error('[LoginPage] Google sign-in error:', error);
      setError('Error signing in with Google. Please try again.');
      
      trackError(
        error,
        'LoginPage.handleGoogleSignIn',
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle development mode login
   */
  const handleDevLogin = async () => {
    if (!isDevelopment) {
      console.warn('[LoginPage] Development login attempted in production');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[LoginPage] Starting development mode login');
      const result = await devSignIn();
      
      if (result?.user) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('[LoginPage] Development login error:', error);
      setError('Error with development login. Please try again.');
      
      trackError(
        error,
        'LoginPage.handleDevLogin',
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <Loading message="Signing in..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light bg-gradient-to-br from-background-light to-gray-200 p-4">
      <div className="login-card bg-white p-10 rounded-lg shadow-md border border-gray-200 text-center max-w-md w-full relative overflow-hidden animate-fadeUp">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        
        {/* Logo */}
        <img 
          src="/images/logo.png" 
          alt="ClayGrounds Logo" 
          className="mb-8 mx-auto h-16 w-auto transition-transform duration-300 hover:scale-105"
        />
        
        <h1 className="text-2xl font-semibold text-primary mb-4">Welcome to ClayGrounds</h1>
        <p className="text-text-light mb-8">Please sign in to continue</p>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-error-light text-error rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Google Sign In Button */}
        <button 
          className="w-full bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-md 
                    flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-primary
                    transform transition duration-300 hover:-translate-y-1 hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {/* Google Logo */}
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google Logo" 
            className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-medium text-base">Sign in with Google</span>
        </button>
        
        {/* Development Mode Login */}
        {isDevelopment && (
          <button 
            className="mt-4 w-full bg-pink-50 text-pink-800 border border-pink-200 py-3 px-4 rounded-md 
                      flex items-center justify-center gap-2 hover:bg-pink-100 hover:border-pink-300
                      transition duration-300"
            onClick={handleDevLogin}
            disabled={isLoading}
          >
            <span className="text-lg">🔧</span>
            <span className="font-medium">Development Testing Login</span>
          </button>
        )}
        
        {/* Loading indicator overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Development mode notice */}
        {isDevelopment && (
          <p className="mt-4 text-xs text-gray-500 opacity-70">
            (Development Mode Only - For Testing)
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;