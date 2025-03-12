import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://ppdynljylqmbkkyjcapd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHlubGp5bHFtYmtreWpjYXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzMyMzgsImV4cCI6MjA1NTY0OTIzOH0.99PUtn0VHw6kwTY8cx_UNfCPal-vJwoIlAG2njqbE4A';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch protected CSV from Supabase
 * @param {string} fileName - CSV file name
 * @returns {Promise<string>} CSV content
 */
export async function fetchProtectedCSV(fileName) {
  try {
    console.log(`[SupabaseService] Fetching protected CSV: ${fileName}`);
    
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    // Try to load from mock data in development mode
    if (isDevelopment && document.body.classList.contains('dev-mode')) {
      console.log('[SupabaseService] Using mock data');
      try {
        // Fetch from local mock data directory
        const response = await fetch(`/mock-data/data/${fileName}`);
        
        if (!response.ok) {
          throw new Error(`Mock data not found: ${fileName}`);
        }
        
        const text = await response.text();
        console.log(`[SupabaseService] Mock data loaded, length: ${text.length}`);
        return text;
      } catch (error) {
        console.error('[SupabaseService] Error loading mock data:', error);
        // Fall back to real data if mock data fails
      }
    }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      throw new Error('Authentication error: ' + sessionError.message);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Download file from Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('protected-csvs')
      .download(`data/${fileName}`);
    
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
    
    // Enhance error message based on error type
    let enhancedError;
    if (error.message.includes('Authentication')) {
      enhancedError = new Error('Please sign in again to access data');
    } else if (error.message.includes('timeout')) {
      enhancedError = new Error('Data download timed out. Please check your connection');
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      enhancedError = new Error(`File ${fileName} not found. Please check the year selection`);
    } else {
      enhancedError = new Error(`Failed to load data: ${error.message}`);
    }
    
    throw enhancedError;
  }
}