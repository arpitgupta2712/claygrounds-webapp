import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';

/**
 * Dashboard header component with user profile
 */
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isDevelopment } = useAuth();
  const { trackError } = useErrorTracker();

  /**
   * Handle sign out action
   */
  const handleSignOut = async () => {
    try {
      console.log('[Header] User signing out');
      await signOut();
      // Redirect handled by AuthContext
    } catch (error) {
      console.error('[Header] Error signing out:', error);
      trackError(
        error,
        'Header.handleSignOut',
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH
      );
    }
  };

  /**
   * Toggle dropdown menu
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 border-b border-gray-200">
          {/* Logo and title */}
          <div className="flex items-center gap-4">
            <img 
              src="/images/logo.png" 
              alt="ClayGrounds Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold text-primary">ClayGrounds by Plaza</h1>
          </div>

          {/* User information */}
          <div className="relative">
            {user || isDevelopment ? (
              <div className="flex items-center">
                {/* Dev mode badge */}
                {isDevelopment && document.body.classList.contains('dev-mode') && (
                  <div className="mr-3 px-2 py-1 bg-pink-100 text-pink-800 text-xs font-semibold rounded">
                    DEV MODE
                  </div>
                )}
                
                {/* User avatar and info */}
                <div 
                  className="flex items-center bg-gray-50 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={toggleMenu}
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User Avatar" 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                      {(user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
                  
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.full_name || user?.email || 'User'}
                    </div>
                    {user?.user_metadata?.full_name && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </div>
                  
                  {/* Dropdown arrow */}
                  <svg 
                    className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isMenuOpen ? 'transform rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700">
                        {user?.user_metadata?.full_name || user?.email || 'User'}
                      </p>
                      {user?.user_metadata?.full_name && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                    
                    <a 
                      href="#profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </a>
                    <a 
                      href="#settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </a>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;