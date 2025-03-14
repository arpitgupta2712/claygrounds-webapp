import { createClient } from '@supabase/supabase-js';
import { ROUTES, getFullUrl } from '../config/routes';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || 'development';
const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// Enhanced debug logging for environment setup
console.log('[SupabaseService] Environment Setup:', {
  environment: appEnv,
  siteUrl,
  hasSupabaseUrl: !!supabaseUrl,
  supabaseUrlLength: supabaseUrl?.length,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length,
  redirectUrl: getFullUrl(ROUTES.AUTH_REDIRECT, siteUrl)
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

// Initialize Supabase client with enhanced configuration
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    pkce: {
      codeChallengeMethod: 'S256',
      codeChallengeInHeader: true // Add PKCE challenge in header
    },
    storage: window.localStorage,
    storageKey: 'supabase-auth-token',
    debug: true,
    redirectTo: getFullUrl(ROUTES.AUTH_REDIRECT, siteUrl),
    onAuthStateChange: (event, session) => {
      console.log('[SupabaseService] Auth State Change:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
    },
    // Add global error handler
    onError: (error) => {
      console.error('[SupabaseService] Auth Error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        timestamp: new Date().toISOString()
      });
    }
  },
  persistSession: true,
  detectSessionInUrl: true,
  headers: {
    'X-Client-Info': 'claygrounds-webapp',
    'X-Environment': appEnv
  },
  // Add global error handler
  global: {
    headers: {
      'X-Client-Info': `claygrounds-webapp-${appEnv}`
    }
  }
});

// Log client initialization
console.log('[SupabaseService] Client Initialized:', {
  timestamp: new Date().toISOString(),
  environment: appEnv,
  redirectUrl: getFullUrl(ROUTES.AUTH_REDIRECT, siteUrl)
});

/**
 * Fetch protected CSV from Supabase
 * @param {string} fileName - Name of the CSV file to fetch
 * @returns {Promise<string>} CSV content as string
 */
export async function fetchProtectedCSV(fileName) {
  try {
    console.log(`[SupabaseService] Fetching protected CSV: ${fileName}`);

    // Check if mock data is enabled
    if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      console.log('[SupabaseService] Using mock data');
      try {
        const response = await fetch(`/mock/${fileName}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log(`[SupabaseService] Mock data loaded, length: ${text.length}`);
        return text;
      } catch (error) {
        console.error('[SupabaseService] Error loading mock data:', error);
        throw error;
      }
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('No active session found');
    }

    // Download file from Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('protected-csvs')
      .download(fileName);

    if (error) {
      console.error('[SupabaseService] Storage error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received from storage');
    }

    const text = await data.text();
    console.log(`[SupabaseService] CSV retrieved, length: ${text.length}`);
    
    return text;
  } catch (error) {
    console.error('[SupabaseService] Error fetching CSV:', error);
    throw error;
  }
}