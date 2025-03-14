import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

/**
 * ProtectedRoute - Ensures user is authenticated before rendering children components
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - The children or a redirect to login
 */
function ProtectedRoute({ children }) {
  const { user, session, isLoading, isInitialized, isDevelopment } = useAuth();
  const location = useLocation();
  
  // Show loading while authentication state is being determined
  if (!isInitialized || isLoading) {
    return <Loading message="Authenticating..." fullScreen />;
  }
  
  // Allow access in development mode with dev-mode flag
  const isDevMode = isDevelopment && document.body.classList.contains('dev-mode');
  
  // If not authenticated, redirect to login page
  if (!user && !session && !isDevMode) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we're in dev mode, log it
  if (isDevMode) {
    console.log('[ProtectedRoute] Allowing access in development mode');
  }
  
  // User is authenticated, render the protected route content
  return children;
}

export default ProtectedRoute;