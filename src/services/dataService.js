import Papa from 'papaparse';
import { fetchProtectedCSV } from './supabase';

// Data cache for improved performance
const dataCache = {
  bookings: new Map(), // Map of year => data
  lastFetch: new Map(), // Map of year => timestamp
  cacheTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  /**
   * Check if data is in cache and not expired
   * @param {string} year - Year identifier
   * @returns {boolean} Whether data is available in cache
   */
  hasValidData(year) {
    if (!this.bookings.has(year)) return false;
    
    const timestamp = this.lastFetch.get(year) || 0;
    return Date.now() - timestamp < this.cacheTTL;
  },
  
  /**
   * Get data from cache
   * @param {string} year - Year identifier
   * @returns {Array|null} Cached data or null
   */
  getData(year) {
    return this.hasValidData(year) ? this.bookings.get(year) : null;
  },
  
  /**
   * Store data in cache
   * @param {string} year - Year identifier
   * @param {Array} data - Data to cache
   */
  setData(year, data) {
    // Ensure we're caching the bookings array, not the metadata object
    const bookingsArray = Array.isArray(data) ? data : (data.bookings || []);
    this.bookings.set(year, bookingsArray);
    this.lastFetch.set(year, Date.now());
    console.log(`[DataCache] Cached ${bookingsArray.length} records for ${year}`);
  },
  
  /**
   * Clear all cached data
   */
  clearAll() {
    this.bookings.clear();
    this.lastFetch.clear();
    console.log('[DataCache] All cache cleared');
  },
  
  /**
   * Clear cache for a specific year
   * @param {string} year - Year identifier
   */
  clear(year) {
    this.bookings.delete(year);
    this.lastFetch.delete(year);
    console.log(`[DataCache] Cache cleared for ${year}`);
  }
};

/**
 * Data service for managing and processing application data
 */
export const dataService = {
  /**
   * Parse CSV data with validation and cleaning
   * @param {string} csvText - CSV text content
   * @returns {Promise<Array>} Parsed data array
   */
  async parseCSVData(csvText) {
    console.log('[DataService] Starting CSV parsing');
    
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Invalid CSV data provided');
    }
    
    return new Promise((resolve, reject) => {
      try {
        if (typeof Papa === 'undefined') {
          throw new Error('PapaParse library not loaded');
        }

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', '|', ';'], // More robust parsing
          transformHeader: (header) => header.trim(), // Trim whitespace from headers
          complete: (results) => {
            console.log(`[DataService] Parse complete. Found ${results.data.length} rows`);
            
            if (results.errors.length > 0) {
              console.warn(`[DataService] Parse warnings: ${results.errors.length} issues`);
            }
            
            // Process the data
            const processedData = this.processData(results.data);
            resolve(processedData);
          },
          error: (error) => {
            console.error('[DataService] CSV parsing failed:', error);
            reject(new Error(`CSV parsing failed: ${error.message}`));
          }
        });
      } catch (error) {
        console.error('[DataService] Unexpected error during CSV parsing:', error);
        reject(error);
      }
    });
  },

  /**
   * Process and clean data after parsing
   * @param {Array} data - Parsed CSV data
   * @returns {Array} Processed data
   */
  processData(data) {
    console.log('[DataService] Processing data');
    
    try {
      // Process each booking record
      return data.map(booking => {
        // Ensure numeric fields are numbers
        const numericFields = ['Slot Price', 'Revenue', 'Balance', 'Total Paid', 'Number of slots',
                             'Cash', 'UPI', 'Bank Transfer', 'Hudle App', 'Hudle QR', 
                             'Hudle Wallet', 'Venue Wallet', 'Hudle Pass', 'Hudle Discount', 
                             'Venue Discount'];
                             
        numericFields.forEach(field => {
          if (booking[field] !== undefined) {
            booking[field] = Number(booking[field]) || 0;
          }
        });
        
        return booking;
      });
    } catch (error) {
      console.error('[DataService] Error processing data:', error);
      return data; // Return original data if processing fails
    }
  },

  /**
   * Load bookings data for a specific year with caching
   * @param {string} year - Year identifier
   * @param {boolean} [forceRefresh=false] - Force data refresh
   * @returns {Promise<Object>} Booking data with metadata
   */
  async loadBookings(year, forceRefresh = false) {
    try {
      console.log(`[DataService] Loading bookings for year: ${year}${forceRefresh ? ' (forced refresh)' : ''}`);
      
      // Handle undefined year gracefully
      if (!year) {
        throw new Error('Year parameter is required');
      }
      
      // Check cache first
      if (!forceRefresh && dataCache.hasValidData(year)) {
        console.log(`[DataService] Using cached data for ${year}`);
        const cachedData = dataCache.getData(year);
        // Ensure cachedData is an array
        const bookingsArray = Array.isArray(cachedData) ? cachedData : [];
        return {
          bookings: bookingsArray,
          metadata: {
            year,
            totalBookings: bookingsArray.length,
            lastUpdated: dataCache.lastFetch.get(year),
            isMockData: false
          }
        };
      }
      
      // Format filename
      const formattedYear = year.replace('-', '');
      const fileName = `bookings${formattedYear}.csv`;
      console.log(`[DataService] Requesting file: ${fileName}`);
      
      try {
        // Fetch CSV from Supabase
        const csvText = await fetchProtectedCSV(fileName);
        if (!csvText) {
          throw new Error('No CSV content received');
        }
        
        // Parse CSV data
        const parsedData = await this.parseCSVData(csvText);
        console.log(`[DataService] Parse complete. ${parsedData.length} records processed`);
        
        // Cache the parsed data array
        dataCache.setData(year, parsedData);
        
        return {
          bookings: parsedData,
          metadata: {
            year,
            totalBookings: parsedData.length,
            lastUpdated: Date.now(),
            isMockData: false
          }
        };
        
      } catch (error) {
        console.warn(`[DataService] Error loading from Supabase: ${error.message}`);
        
        // Check for specific Supabase storage errors
        const isStorageError = error.message?.includes('storage') || 
                             error.message?.includes('bucket') ||
                             error.message?.includes('download');
                             
        if (isStorageError) {
          console.log(`[DataService] Using mock data for year ${year}`);
          const mockData = [];
          // Cache the empty mock data array
          dataCache.setData(year, mockData);
          return {
            bookings: mockData,
            metadata: {
              year,
              totalBookings: 0,
              lastUpdated: Date.now(),
              isMockData: true,
              errorMessage: 'Unable to access booking data. Please ensure you have the correct permissions.',
              storageError: error.message
            }
          };
        }
        
        // Re-throw other errors
        throw error;
      }
      
    } catch (error) {
      console.error('[DataService] Error loading bookings:', error);
      throw error;
    }
  },
  
  /**
   * Refresh the cache for a specific year
   * @param {string} year - Year identifier
   * @returns {Promise<boolean>} Success status
   */
  async refreshCache(year) {
    try {
      console.log(`[DataService] Refreshing cache for ${year}`);
      await this.loadBookings(year, true);
      return true;
    } catch (error) {
      console.error(`[DataService] Error refreshing cache: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Clear all cached data
   */
  clearCache() {
    dataCache.clearAll();
  }
};