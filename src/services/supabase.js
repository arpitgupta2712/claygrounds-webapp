import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Initialize Supabase client with environment variables
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Add additional options as needed
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
      .from('bookings')
      .download(fileName);

    if (error) {
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