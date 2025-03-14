import { createContext, useState, useEffect, useContext } from 'react';
import { supabaseClient } from '../services/supabase';
import { useErrorTracker } from '../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';
import { ROUTES, getCurrentOriginUrl, getFullUrl } from '../config/routes';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { trackError } = useErrorTracker();
  
  // Development mode detection
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  // Get site URL from environment
  const siteUrl = import.meta.env.VITE_SITE_URL;

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth');
    let authListener;
    let isSettingUp = true;
    
    async function setupAuth() {
      try {
        console.log('[AuthProvider] Starting auth setup...');
        
        // Check for existing session
        const { data: { session: existingSession }, error: sessionError } = await supabaseClient.auth.getSession();
        
        console.log('[AuthProvider] Session check result:', { 
          hasSession: !!existingSession,
          hasError: !!sessionError 
        });
        
        if (sessionError) {
          console.error('[AuthProvider] Session check error:', sessionError);
          trackError(
            sessionError,
            'AuthProvider.setupAuth',
            ErrorSeverity.ERROR,
            ErrorCategory.AUTH,
            {
              stage: 'session_check',
              isDevelopment,
              timestamp: new Date().toISOString(),
              hasExistingSession: !!existingSession
            }
          );
        }
        
        if (existingSession) {
          console.log('[AuthProvider] Found existing session');
          setSession(existingSession);
          setUser(existingSession.user);
        } else {
          console.log('[AuthProvider] No existing session found');
          setSession(null);
          setUser(null);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log(`[AuthProvider] Auth state changed: ${event}`, {
              hasSession: !!currentSession,
              userEmail: currentSession?.user?.email
            });
            
            if (event === 'SIGNED_IN') {
              setSession(currentSession);
              setUser(currentSession?.user || null);
              console.log('[AuthProvider] User signed in:', currentSession?.user?.email);
            } else if (event === 'SIGNED_OUT') {
              setSession(null);
              setUser(null);
              console.log('[AuthProvider] User signed out');
            } else if (event === 'TOKEN_REFRESHED') {
              setSession(currentSession);
              console.log('[AuthProvider] Session token refreshed');
            }

            // Only track non-initial auth state changes
            if (event !== 'INITIAL_SESSION') {
              trackError(
                null,
                'AuthProvider.authStateChange',
                ErrorSeverity.INFO,
                ErrorCategory.AUTH,
                {
                  event,
                  hasSession: !!currentSession,
                  timestamp: new Date().toISOString(),
                  isDevelopment,
                  userEmail: currentSession?.user?.email || 'none'
                }
              );
            }
          }
        );
        
        authListener = subscription;
        
        if (isSettingUp) {
          console.log('[AuthProvider] Auth setup complete');
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthProvider] Error in auth setup:', error);
        trackError(
          error,
          'AuthProvider.setupAuth', 
          ErrorSeverity.ERROR,
          ErrorCategory.AUTH,
          {
            stage: 'initialization',
            isDevelopment,
            timestamp: new Date().toISOString(),
            isInitialized: false
          }
        );
        if (isSettingUp) {
          setIsLoading(false);
        }
      }
    }
    
    setupAuth();
    
    return () => {
      isSettingUp = false;
      if (authListener?.unsubscribe) {
        console.log('[AuthProvider] Cleaning up auth listener');
        authListener.unsubscribe();
      }
    };
  }, [trackError, isDevelopment]);
  
  // Add session refresh mechanism
  useEffect(() => {
    if (!session) return;

    // Refresh session every 10 minutes
    const REFRESH_INTERVAL = 10 * 60 * 1000;
    
    const refreshTimer = setInterval(async () => {
      try {
        console.log('[AuthProvider] Refreshing session');
        const { data, error } = await supabaseClient.auth.refreshSession();
        
        if (error) {
          console.error('[AuthProvider] Session refresh error:', error);
          trackError(
            error,
            'AuthProvider.sessionRefresh',
            ErrorSeverity.ERROR,
            ErrorCategory.AUTH,
            {
              stage: 'refresh',
              isDevelopment,
              timestamp: new Date().toISOString(),
              hasSession: !!session
            }
          );
          return;
        }

        if (data?.session) {
          console.log('[AuthProvider] Session refreshed successfully');
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('[AuthProvider] Session refresh error:', error);
        trackError(
          error,
          'AuthProvider.sessionRefresh',
          ErrorSeverity.ERROR,
          ErrorCategory.AUTH,
          {
            stage: 'refresh',
            isDevelopment,
            timestamp: new Date().toISOString(),
            hasSession: !!session
          }
        );
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshTimer);
  }, [session, isDevelopment]);
  
  async function signInWithGoogle() {
    try {
      console.log('[AuthProvider] Initiating Google sign in');
      const redirectUrl = getFullUrl(ROUTES.AUTH_REDIRECT, siteUrl);
      console.log('[AuthProvider] Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('[AuthProvider] Google sign in error:', error);
        throw error;
      }
      console.log('[AuthProvider] Sign in initiated:', data);
      return data;
    } catch (error) {
      console.error('[AuthProvider] Google sign in error:', error);
      trackError(
        error,
        'AuthProvider.signInWithGoogle', 
        ErrorSeverity.ERROR,
        ErrorCategory.AUTH,
        {
          origin: window.location.origin,
          siteUrl,
          isDevelopment,
          timestamp: new Date().toISOString()
        }
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
    isInitialized,
    signInWithGoogle,
    signOut,
    devSignIn,
    hasLocationAccess,
    isDevelopment
  };
  
  // Show loading state while auth is initializing
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}