import { createContext, useState, useEffect, useContext } from 'react';
import { supabaseClient } from '../services/supabase';
import { useErrorTracker } from '../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { trackError } = useErrorTracker();
  
  // Development mode detection
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth');
    
    async function setupAuth() {
      try {
        // Check for existing session
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data?.session || null);
        setUser(data?.session?.user || null);
        
        // Set up auth state change listener
        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`[AuthProvider] Auth state changed: ${event}`);
            setSession(session);
            setUser(session?.user || null);
          }
        );
        
        return () => {
          if (authListener?.subscription?.unsubscribe) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('[AuthProvider] Error in auth setup:', error);
        trackError(
          error,
          'AuthProvider.setupAuth', 
          ErrorSeverity.ERROR,
          ErrorCategory.AUTH
        );
      } finally {
        setIsLoading(false);
      }
    }
    
    setupAuth();
  }, [trackError]);
  
  async function signInWithGoogle() {
    try {
      console.log('[AuthProvider] Initiating Google sign in');
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[AuthProvider] Google sign in error:', error);
      trackError(
        error,
        'AuthProvider.signInWithGoogle', 
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH
      );
      throw error;
    }
  }
  
  async function signOut() {
    try {
      console.log('[AuthProvider] Signing out');
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      trackError(
        error,
        'AuthProvider.signOut', 
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH
      );
      throw error;
    }
  }
  
  // Development mode sign-in bypass
  async function devSignIn() {
    // Only allow this in development mode
    if (!isDevelopment) {
      console.warn('[AuthProvider] Development sign-in attempted in production!');
      return null;
    }
    
    console.log('[AuthProvider] Using development testing bypass');
    
    // Mock user session data
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev-test@example.com',
      user_metadata: {
        full_name: 'Development Tester',
        avatar_url: 'https://ui-avatars.com/api/?name=Dev+Tester&background=random'
      }
    };
    
    // Update state
    setSession({ user: mockUser });
    setUser(mockUser);
    
    document.body.classList.add('dev-mode');
    
    return { user: mockUser };
  }
  
  // Check if user has access to a specific location
  function hasLocationAccess(location) {
    console.log(`[AuthProvider] Checking access for location: ${location}`);
    
    // For development/testing - enable all access
    if (isDevelopment) return true;
    
    try {
      const userEmail = user?.email;
      
      if (!userEmail) {
        console.warn('[AuthProvider] No user email found for location access check');
        return true; // Temporary: allow access when we can't determine the user
      }
      
      // Define location access permissions by user
      const locationAccessMap = {
        // Example: Admin user with access to all locations
        'admin@example.com': 'all',
        
        // Your user with access to specific locations
        'arpit.rainman@gmail.com': ['IMS Noida', 'Chattarpur', 'Lajpat Nagar', 'Defence Colony'],
        
        // Other example users
        'manager@example.com': ['Chattarpur', 'Lajpat Nagar'],
        'staff@example.com': ['IMS Noida']
      };
      
      // For development/testing - enable all access for now
      return true;
      
      /* Uncomment this when you're ready to enforce actual access control:
      // Check if user has access
      const userAccess = locationAccessMap[userEmail];
      
      // If user has 'all' access or specific location is in their list
      if (userAccess === 'all' || 
          (Array.isArray(userAccess) && userAccess.includes(location))) {
        return true;
      }
      
      return false;
      */
    } catch (error) {
      console.error('[AuthProvider] Error checking location access:', error);
      return true; // Default to allowing access on error for now
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
    devSignIn,
    hasLocationAccess,
    isDevelopment
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}