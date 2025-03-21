import { createContext, useState, useEffect, useContext } from 'react';
import { supabaseClient } from '../services/supabase';
import { useErrorHandler } from '../hooks/useErrorHandler';
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
  const { handleAsync, handleError } = useErrorHandler();
  
  // Development mode detection
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  // Get site URL from environment
  const siteUrl = import.meta.env.VITE_SITE_URL;

  // Initial session check effect
  useEffect(() => {
    let mounted = true;
    
    async function checkSession() {
      await handleAsync(
        async () => {
          if (!mounted) return;
          
          // Check for existing session
          const { data: { session: existingSession }, error: sessionError } = await supabaseClient.auth.getSession();
          
          if (!mounted) return;
          
          if (sessionError) {
            console.error('[AuthProvider] Session check error:', sessionError);
            handleError(
              sessionError,
              'AuthProvider.checkSession',
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
            setSession(existingSession);
            setUser(existingSession.user);
          } else {
            setSession(null);
            setUser(null);
          }
          
          if (mounted) {
            setIsInitialized(true);
            setIsLoading(false);
          }
        },
        'AuthProvider.checkSession',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          metadata: {
            stage: 'initialization',
            isDevelopment,
            timestamp: new Date().toISOString(),
            isInitialized: false
          }
        }
      );
    }
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, [handleAsync, handleError, isDevelopment]);

  // Auth state change listener effect
  useEffect(() => {
    let mounted = true;
    let subscription;
    
    async function setupAuthListener() {
      const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mounted) return;
          
          if (event === 'SIGNED_IN') {
            setSession(currentSession);
            setUser(currentSession?.user || null);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            setSession(currentSession);
          }

          // Only track non-initial auth state changes with actual errors
          if (event !== 'INITIAL_SESSION') {
            // Log state changes without treating them as errors
            console.log(`[AuthProvider] Auth state changed: ${event}`, {
              hasSession: !!currentSession,
              userEmail: currentSession?.user?.email
            });
          }
        }
      );
      
      subscription = authSubscription;
    }
    
    setupAuthListener();
    
    return () => {
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);
  
  // Session refresh effect
  useEffect(() => {
    if (!session) return;

    let mounted = true;
    const REFRESH_INTERVAL = 10 * 60 * 1000;
    
    const refreshTimer = setInterval(async () => {
      if (!mounted) return;
      
      await handleAsync(
        async () => {
          if (!mounted) return;
          
          const { data, error } = await supabaseClient.auth.refreshSession();
          
          if (error) {
            console.error('[AuthProvider] Session refresh error:', error);
            throw error;
          }

          if (data?.session && mounted) {
            setSession(data.session);
            setUser(data.session.user);
          }
        },
        'AuthProvider.sessionRefresh',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          metadata: {
            stage: 'refresh',
            isDevelopment,
            timestamp: new Date().toISOString(),
            hasSession: !!session
          }
        }
      );
    }, REFRESH_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, [session, isDevelopment, handleAsync]);
  
  async function signInWithGoogle() {
    return handleAsync(
      async () => {
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
      },
      'AuthProvider.signInWithGoogle',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.AUTH,
        metadata: {
          origin: window.location.origin,
          siteUrl,
          isDevelopment,
          timestamp: new Date().toISOString()
        },
        rethrow: true // We want to handle the error in the component
      }
    );
  }
  
  async function signOut() {
    return handleAsync(
      async () => {
        console.log('[AuthProvider] Signing out');
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
      },
      'AuthProvider.signOut',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.AUTH,
        metadata: {
          userId: user?.id,
          isDevelopment,
          timestamp: new Date().toISOString()
        },
        rethrow: true // We want to handle the error in the component
      }
    );
  }
  
  async function devSignIn() {
    if (!isDevelopment) {
      console.warn('[AuthProvider] Development sign in attempted in production');
      return;
    }

    return handleAsync(
      async () => {
        console.log('[AuthProvider] Development mode sign in');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: 'dev@example.com',
          password: 'development-only'
        });

        if (error) throw error;
        return data;
      },
      'AuthProvider.devSignIn',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.AUTH,
        metadata: {
          isDevelopment,
          timestamp: new Date().toISOString()
        },
        rethrow: true // We want to handle the error in the component
      }
    );
  }

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
    isDevelopment,
    signInWithGoogle,
    signOut,
    devSignIn,
    hasLocationAccess
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