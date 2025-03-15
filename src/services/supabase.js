import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { ErrorCategory, ErrorSeverity } from '../utils/errorTypes';
import { ROUTES, getFullUrl } from '../config/routes';

// Enhanced environment detection
const getEnvironmentInfo = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevelopmentBranch = hostname === 'development--claygroundspartner.netlify.app';
  const isNetlifyPreview = hostname.includes('netlify.app') && !isDevelopmentBranch;
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Determine the effective site URL based on environment
  let effectiveSiteUrl;
  if (isDevelopmentBranch) {
    // Always use the fixed development URL
    effectiveSiteUrl = 'https://development--claygroundspartner.netlify.app';
  } else if (isNetlifyPreview) {
    // For other preview deployments, use current origin
    effectiveSiteUrl = currentOrigin;
  } else {
    // For production and local, use configured URL or fallback to origin
    effectiveSiteUrl = configuredSiteUrl || currentOrigin;
  }
  
  // Log warning only if we're in production and missing the URL
  if (!configuredSiteUrl && !isNetlifyPreview && !isLocalhost && !isDevelopmentBranch) {
    logger.warn(ErrorCategory.AUTH, 'Missing VITE_SITE_URL in production', { 
      hostname,
      environment: 'production'
    });
  }
  
  return {
    isDevelopment: isLocalhost || isNetlifyPreview || isDevelopmentBranch || import.meta.env.VITE_APP_ENV === 'development',
    isProduction: !isLocalhost && !isNetlifyPreview && !isDevelopmentBranch && import.meta.env.VITE_APP_ENV === 'production',
    hostname,
    origin: currentOrigin,
    configuredSiteUrl,
    effectiveSiteUrl,
    isNetlifyPreview,
    isDevelopmentBranch
  };
};

const env = getEnvironmentInfo();

// Get and validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Validate Supabase key format
if (supabaseAnonKey && (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3)) {
  logger.error(ErrorCategory.AUTH, 'Invalid Supabase key format', {
    keyLength: supabaseAnonKey.length,
    hasCorrectParts: supabaseAnonKey.split('.').length === 3
  });
  throw new Error('Invalid Supabase key format: Should be a valid JWT token');
}

// Use the effective site URL which handles all environments correctly
const siteUrl = env.effectiveSiteUrl;

// Debug logging for environment setup
logger.debug(ErrorCategory.AUTH, 'Supabase Environment Setup', {
  environment: env.isDevelopment ? 'development' : 'production',
  hostname: env.hostname,
  isLocalhost: env.hostname === 'localhost',
  isNetlifyPreview: env.isNetlifyPreview,
  isDevelopmentBranch: env.isDevelopmentBranch,
  configuredSiteUrl: env.configuredSiteUrl,
  effectiveSiteUrl: env.effectiveSiteUrl,
  actualSiteUrl: siteUrl,
  origin: env.origin,
  hasValidSupabaseKey: supabaseAnonKey?.split('.').length === 3
});

// Always use effective site URL for redirect in auth flow
const redirectUrl = getFullUrl(ROUTES.AUTH_REDIRECT, siteUrl);

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

// Initialize Supabase client with environment-aware configuration
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
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'supabase-auth-token',
    debug: env.isDevelopment,
    redirectTo: redirectUrl
  },
  global: {
    headers: {
      'X-Client-Info': 'claygrounds-webapp',
      'X-Environment': env.isDevelopment ? 'development' : 'production',
      'X-Origin': env.origin,
      'X-Site-URL': siteUrl,
      'X-Deploy-Type': env.isDevelopmentBranch ? 'development-branch' : 
                      env.isNetlifyPreview ? 'preview' : 
                      env.isProduction ? 'production' : 'local'
    }
  }
});

// Log initialization details
logger.info(ErrorCategory.AUTH, 'Supabase Client Initialized', {
  timestamp: new Date().toISOString(),
  environment: env.isDevelopment ? 'development' : 'production',
  redirectUrl,
  origin: env.origin,
  isProduction: env.isProduction,
  siteUrl
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