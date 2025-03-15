import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { ErrorCategory } from '../utils/errorTypes';
import { ROUTES } from '../config/routes';

// Simple environment check
const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const siteUrl = import.meta.env.VITE_SITE_URL?.trim();

// Basic validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration');
}

// For auth redirect, use the configured site URL or fallback to window.location.origin
const getRedirectUrl = () => {
  if (typeof window === 'undefined') return siteUrl;
  
  const redirectBase = window.location.origin;
  const redirectPath = ROUTES.AUTH_REDIRECT;
  const fullRedirectUrl = `${redirectBase}${redirectPath}`;
  
  logger.debug(ErrorCategory.AUTH, 'Generated redirect URL', {
    base: redirectBase,
    path: redirectPath,
    full: fullRedirectUrl
  });
  
  return fullRedirectUrl;
};

// Initialize Supabase client with minimal configuration
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'supabase-auth-token',
    redirectTo: getRedirectUrl(),
    flowType: 'implicit' // Explicitly set to implicit flow
  }
});

// Debug logging for initial setup
logger.debug(ErrorCategory.AUTH, 'Supabase Configuration', {
  environment: isDevelopment ? 'development' : 'production',
  siteUrl,
  redirectUrl: getRedirectUrl(),
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseAnonKey,
  flowType: 'implicit'
});

// Set up auth state change listener immediately
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
        error: error.message,
        status: error.status
      });
      return;
    }
    
    if (session) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        logger.error(ErrorCategory.AUTH, 'Error getting user details', {
          error: userError.message,
          sessionId: session.id
        });
        return;
      }
      
      logger.info(ErrorCategory.AUTH, 'Session check successful', {
        role: user?.role || 'authenticated',
        id: user?.id,
        email: user?.email,
        hasSession: true
      });
    } else {
      logger.info(ErrorCategory.AUTH, 'No active session');
    }
  } catch (err) {
    logger.error(ErrorCategory.AUTH, 'Error during session check', {
      error: err.message,
      stack: isDevelopment ? err.stack : undefined
    });
  }
})();

// Disable Supabase's internal debug logs in production
if (process.env.NODE_ENV === 'production') {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    // Only log critical auth events in production
    if (['SIGNED_OUT', 'USER_DELETED', 'TOKEN_REFRESHED'].includes(event)) {
      logger.info(ErrorCategory.AUTH, `Auth state changed: ${event}`);
    }
  });
}

/**
 * Fetch protected CSV from Supabase
 * @param {string} fileName - Name of the CSV file to fetch
 * @returns {Promise<string>} CSV content as string
 */
export async function fetchProtectedCSV(fileName) {
  logger.debug(ErrorCategory.DATA, `Fetching CSV: ${fileName}`);
  
  try {
    // Verify session first
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }
    
    logger.debug(ErrorCategory.AUTH, 'Session verified', {
      userId: session.user.id,
      email: session.user.email
    });

    // List files in bucket to verify access
    const { data: files, error: listError } = await supabaseClient.storage
      .from('protected-csvs')
      .list('data');

    if (listError) {
      throw listError;
    }

    // Download the file
    const { data, error } = await supabaseClient.storage
      .from('protected-csvs')
      .download(`data/${fileName}`);

    if (error) {
      throw error;
    }

    const text = await data.text();
    logger.debug(ErrorCategory.DATA, `CSV retrieved, length: ${text.length}`);
    return text;

  } catch (error) {
    logger.error(ErrorCategory.DATA, `Failed to fetch CSV: ${fileName}`, error);
    throw error;
  }
}