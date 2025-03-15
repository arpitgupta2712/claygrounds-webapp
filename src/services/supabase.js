import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { ErrorCategory } from '../utils/errorTypes';
import { ROUTES } from '../config/routes';

// Get and validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is missing');
  }
  
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing');
  } else {
    // Validate key format (should be a JWT token)
    const parts = supabaseAnonKey.split('.');
    if (parts.length !== 3) {
      errors.push('VITE_SUPABASE_ANON_KEY is not in valid JWT format');
    }
    
    // Check if key is truncated (comparing with known length)
    const expectedLength = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHlubGp5bHFtYmtreWpjYXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzMyMzgsImV4cCI6MjA1NTY0OTIzOH0.99PUtn0VHw6kwTY8cx_UNfCPal-vJwoIlAG2njqbE4A'.length;
    if (supabaseAnonKey.length !== expectedLength) {
      errors.push(`VITE_SUPABASE_ANON_KEY appears to be truncated. Expected length: ${expectedLength}, got: ${supabaseAnonKey.length}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error('Supabase configuration errors:\n' + errors.join('\n'));
  }
}

// Validate before proceeding
validateConfig();

// Initialize Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'supabase-auth-token',
    flowType: 'pkce'
  }
});

// Debug logging for initialization
logger.debug(ErrorCategory.AUTH, 'Supabase Configuration', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyFormat: 'JWT',
  storage: 'localStorage'
});

// Set up auth state change listener
supabaseClient.auth.onAuthStateChange((event, session) => {
  logger.info(ErrorCategory.AUTH, `Auth state changed: ${event}`, {
    event,
    hasSession: !!session,
    userId: session?.user?.id
  });
});

// Initial session check
(async () => {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      logger.error(ErrorCategory.AUTH, 'Initial session check failed', {
        error: error.message
      });
      return;
    }
    
    if (session) {
      logger.info(ErrorCategory.AUTH, 'Active session found', {
        userId: session.user.id
      });
    } else {
      logger.info(ErrorCategory.AUTH, 'No active session');
    }
  } catch (err) {
    logger.error(ErrorCategory.AUTH, 'Error during session check', {
      error: err.message
    });
  }
})();

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    // Clear any existing session first
    await supabaseClient.auth.signOut();
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('supabase-auth-token');
    }
    
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${ROUTES.AUTH_REDIRECT}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) throw error;
  } catch (error) {
    logger.error(ErrorCategory.AUTH, 'Google sign in failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('supabase-auth-token');
    }
  } catch (error) {
    logger.error(ErrorCategory.AUTH, 'Sign out failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Get the current session
 * @returns {Promise<Session|null>}
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error) {
    logger.error(ErrorCategory.AUTH, 'Get session failed', {
      error: error.message
    });
    throw error;
  }
  
  return session;
}

/**
 * Fetch protected CSV from Supabase
 * @param {string} fileName - Name of the CSV file to fetch
 * @returns {Promise<string>} CSV content as string
 */
export async function fetchProtectedCSV(fileName) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabaseClient.storage
      .from('protected-csvs')
      .download(`data/${fileName}`);

    if (error) {
      throw error;
    }

    return await data.text();
  } catch (error) {
    logger.error(ErrorCategory.DATA, `Failed to fetch CSV: ${fileName}`, {
      error: error.message
    });
    throw error;
  }
}