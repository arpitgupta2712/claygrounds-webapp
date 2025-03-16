import Papa from 'papaparse';
import { fetchProtectedCSV } from './supabase';

// Singleton loading state
const loadingState = {
  isLoading: false,
  pendingRequests: new Map(),
  cache: new Map()
};

class DataService {
  constructor() {
    // Initialize with a 5-minute cache TTL
    this.cacheTTL = 5 * 60 * 1000;
    this.initializeCache();
  }

  initializeCache() {
    if (typeof window !== 'undefined') {
      // Clear cache on window unload
      window.addEventListener('unload', () => this.clearCache());
    }
  }

  async loadBookings(year, forceRefresh = false) {
    console.log(`[DataService] Loading bookings for year: ${year}${forceRefresh ? ' (forced)' : ''}`);

    try {
      // Check pending requests first
      if (loadingState.pendingRequests.has(year)) {
        console.debug('[DataService] Using existing request for year:', year);
        return loadingState.pendingRequests.get(year);
      }

      // Check cache if not forcing refresh
      if (!forceRefresh && this.hasValidCache(year)) {
        console.debug('[DataService] Using cached data for year:', year);
        const cachedData = loadingState.cache.get(year);
        return {
          bookings: cachedData.data,
          metadata: { year, fromCache: true, timestamp: cachedData.timestamp }
        };
      }

      // Create new loading promise
      const loadingPromise = this._loadBookingsData(year);
      loadingState.pendingRequests.set(year, loadingPromise);

      const result = await loadingPromise;
      return result;

    } catch (error) {
      console.error('[DataService] Error in loadBookings:', error);
      throw error;
    } finally {
      loadingState.pendingRequests.delete(year);
    }
  }

  async _loadBookingsData(year) {
    if (loadingState.isLoading) {
      console.debug('[DataService] Another load in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.loadBookings(year);
    }

    loadingState.isLoading = true;

    try {
      // Format the year for filename
      const formattedYear = year.replace('-', '');
      console.log('[DataService] Requesting file:', `bookings${formattedYear}.csv`);

      // Fetch CSV data from Supabase
      const csvText = await fetchProtectedCSV(`bookings${formattedYear}.csv`);
      if (!csvText) {
        throw new Error('No CSV content received');
      }

      // Parse CSV data
      console.log('[DataService] Starting CSV parsing');
      const parsedData = await this.parseCSV(csvText);
      
      // Process the parsed data
      console.log(`[DataService] Processing ${parsedData.length} records`);
      const processedData = this.processData(parsedData);
      
      // Cache the results
      this.cacheData(year, processedData);

      return {
        bookings: processedData,
        metadata: {
          year,
          totalBookings: processedData.length,
          lastUpdated: Date.now()
        }
      };

    } catch (error) {
      console.error('[DataService] Error loading data:', error);
      throw error;
    } finally {
      loadingState.isLoading = false;
    }
  }

  parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('[DataService] Parse warnings:', results.errors);
          }
          console.log(`[DataService] Parse complete. Found ${results.data.length} rows`);
          resolve(results.data);
        },
        error: (error) => {
          console.error('[DataService] CSV parsing failed:', error);
          reject(error);
        }
      });
    });
  }

  processData(data) {
    if (!Array.isArray(data)) {
      console.error('[DataService] Invalid data format:', typeof data);
      return [];
    }

    return data.map(booking => {
      // Ensure numeric fields are numbers
      const numericFields = [
        'Slot Price', 'Revenue', 'Balance', 'Total Paid',
        'Number of slots', 'Cash', 'UPI', 'Bank Transfer',
        'Hudle App', 'Hudle QR', 'Hudle Wallet', 'Venue Wallet',
        'Hudle Pass', 'Hudle Discount', 'Venue Discount'
      ];

      const processed = { ...booking };
      numericFields.forEach(field => {
        if (processed[field] !== undefined) {
          processed[field] = Number(processed[field]) || 0;
        }
      });

      return processed;
    });
  }

  hasValidCache(year) {
    const cached = loadingState.cache.get(year);
    if (!cached) return false;
    
    const { timestamp } = cached;
    return timestamp && (Date.now() - timestamp < this.cacheTTL);
  }

  cacheData(year, data) {
    loadingState.cache.set(year, {
      data,
      timestamp: Date.now()
    });
    console.log(`[DataCache] Cached ${data.length} records for ${year}`);
  }

  clearCache() {
    loadingState.cache.clear();
    console.log('[DataCache] Cache cleared');
  }
}

// Create singleton instance
const dataService = new DataService();
export { dataService };