import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { ErrorCategory, ErrorSeverity } from '../utils/errorTypes';
import { ROUTES, getFullUrl } from '../config/routes';

// Get environment variables and clean them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const appEnv = import.meta.env.VITE_APP_ENV || 'development';
const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// Debug: Log key format and first few characters
console.log('[SupabaseService] Key Format Check:', {
  keyParts: supabaseAnonKey?.split('.').length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  isValidJWT: supabaseAnonKey?.split('.').length === 3,
  keyStart: supabaseAnonKey?.substring(0, 5) + '...',
  keyEnd: '...' + supabaseAnonKey?.substring(supabaseAnonKey.length - 5)
});

// Always use current window location for redirect in auth flow
const currentUrl = window.location.origin;
const redirectUrl = getFullUrl(ROUTES.AUTH_REDIRECT, currentUrl);

// Enhanced debug logging for environment setup
console.log('[SupabaseService] Environment Setup:', {
  environment: appEnv,
  configuredSiteUrl: siteUrl,
  currentOrigin: currentUrl,
  actualRedirectUrl: redirectUrl,
  hasSupabaseUrl: !!supabaseUrl,
  supabaseUrlLength: supabaseUrl?.length,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length
});

// Validate environment variables - only in production
const isDevelopment = appEnv === 'development' || typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (!supabaseUrl || !supabaseAnonKey || (!siteUrl && !isDevelopment)) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  if (!siteUrl && !isDevelopment) missingVars.push('VITE_SITE_URL');
  
  throw new Error(
    `Missing environment variables: ${missingVars.join(', ')}. Current environment: ${appEnv}`
  );
}

// Validate Supabase URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
}

// Validate Supabase key format (should be a JWT)
if (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3) {
  throw new Error('Invalid VITE_SUPABASE_ANON_KEY format: Should be a valid JWT token with 3 parts');
}

// Initialize Supabase client with enhanced configuration
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    pkce: {
      codeChallengeMethod: 'S256',
      codeChallengeInHeader: true
    },
    storage: window.localStorage,
    storageKey: 'supabase-auth-token',
    debug: true, // Enable debug for all environments temporarily
    redirectTo: redirectUrl // Always use current origin for redirect
  },
  global: {
    headers: {
      'X-Client-Info': 'claygrounds-webapp',
      'X-Environment': appEnv,
      'X-Origin': window.location.origin
    }
  }
});

// Verify the client is working with role check
(async () => {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('[SupabaseService] Initial session check failed:', error);
    } else if (session) {
      // Get user role and permissions
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        console.error('[SupabaseService] Error getting user details:', userError);
      } else {
        console.log('[SupabaseService] Initial session check successful:', {
          role: user?.role || 'authenticated',
          id: user?.id,
          email: user?.email,
          hasSession: true
        });
      }
    } else {
      console.log('[SupabaseService] No active session');
    }
  } catch (err) {
    console.error('[SupabaseService] Error during initial session check:', err);
  }
})();

// Log client initialization
console.log('[SupabaseService] Client Initialized:', {
  timestamp: new Date().toISOString(),
  environment: appEnv,
  redirectUrl: redirectUrl,
  origin: window.location.origin
});

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