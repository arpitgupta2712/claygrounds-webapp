import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { ErrorCategory } from '../utils/errorTypes';
import { ROUTES } from '../config/routes';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Basic validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration');
}

// Initialize Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'supabase-auth-token'
  }
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
 * @returns {Promise<void>}
 */
export async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${ROUTES.AUTH_REDIRECT}`
    }
  });

  if (error) {
    logger.error(ErrorCategory.AUTH, 'Google sign in failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
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