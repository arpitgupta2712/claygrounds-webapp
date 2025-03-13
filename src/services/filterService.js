import { FilterTypes, FilterConfig } from '../utils/constants';
import { formatDate, parseDate, isDateInRange } from '../utils/dateUtils';

// Cache for storing filtered results
const filterCache = new Map();

/**
 * Service for filtering and searching data
 */
export const filterService = {
  /**
   * Apply filters to booking data with caching
   * @param {Array} data - Array of booking objects
   * @param {string} filterType - Type of filter to apply
   * @param {*} filterValue - Filter value
   * @returns {Array} Filtered data
   */
  applyFilters(data, filterType, filterValue) {
    // Generate cache key
    const cacheKey = `${filterType}_${JSON.stringify(filterValue)}_${data.length}`;
    
    // Check cache
    if (filterCache.has(cacheKey)) {
      console.log(`[FilterService] Using cached results for ${filterType} filter`);
      return filterCache.get(cacheKey);
    }
    
    console.log(`[FilterService] Applying filter: ${filterType}`, filterValue);

    if (!filterType || !FilterConfig[filterType]) {
      console.warn('[FilterService] No valid filter type specified');
      return data;
    }

    try {
      let filteredData = [...data];
      
      switch (filterType) {
        case FilterTypes.SINGLE_DATE:
          filteredData = this.filterByDate(filteredData, filterValue);
          break;
        case FilterTypes.DATE_RANGE:
          filteredData = this.filterByDateRange(filteredData, filterValue.startDate, filterValue.endDate);
          break;
        case FilterTypes.LOCATION:
          filteredData = this.filterByField(filteredData, 'Location', filterValue);
          break;
        case FilterTypes.CUSTOMER:
          filteredData = this.filterByCustomer(filteredData, filterValue);
          break;
        case FilterTypes.BOOKING_REF:
          filteredData = this.filterByBookingRef(filteredData, filterValue);
          break;
        case FilterTypes.PHONE:
          filteredData = this.filterByPhone(filteredData, filterValue);
          break;
        case FilterTypes.BALANCE:
          filteredData = this.filterByBalance(filteredData, filterValue);
          break;
      }

      console.log(`[FilterService] Filter applied. Results: ${filteredData.length} records`);
      
      // Cache the result
      filterCache.set(cacheKey, filteredData);
      
      // Limit cache size
      if (filterCache.size > 20) {
        const oldestKey = filterCache.keys().next().value;
        filterCache.delete(oldestKey);
      }
      
      return filteredData;
    } catch (error) {
      console.error(`[FilterService] Error applying filters: ${error.message}`);
      throw new Error(`Failed to apply filters: ${error.message}`);
    }
  },

  /**
   * Filter data by specific date
   * @param {Array} data - Array of booking objects
   * @param {string} dateStr - Date string to filter by
   * @returns {Array} Filtered data
   */
  filterByDate(data, dateStr) {
    if (!dateStr) return data;
    console.log(`[FilterService] Filtering by date: ${dateStr}`);
    
    const formattedDate = formatDate(new Date(dateStr));
    return data.filter(booking => booking["Slot Date"] === formattedDate);
  },

  /**
   * Filter data by date range
   * @param {Array} data - Array of booking objects
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @returns {Array} Filtered data
   */
  filterByDateRange(data, startDate, endDate) {
    console.log(`[FilterService] Filtering by date range: ${startDate} to ${endDate}`);
    
    if (!startDate && !endDate) {
      console.warn('[FilterService] No date range provided');
      return data;
    }
    
    return data.filter(booking => 
      isDateInRange(
        booking["Slot Date"],
        startDate ? formatDate(new Date(startDate)) : null,
        endDate ? formatDate(new Date(endDate)) : null
      )
    );
  },

  /**
   * Filter data by field value
   * @param {Array} data - Array of booking objects
   * @param {string} field - Field to filter by
   * @param {*} value - Value to filter for
   * @returns {Array} Filtered data
   */
  filterByField(data, field, value) {
    if (!value) return data;
    console.log(`[FilterService] Filtering by field: ${field}=${value}`);
    
    // Normalize the search value
    const searchValue = String(value).trim().toLowerCase();
    
    return data.filter(booking => {
      const fieldValue = booking[field];
      // Handle null/undefined values and convert to string for comparison
      return fieldValue && String(fieldValue).trim().toLowerCase() === searchValue;
    });
  },

  /**
   * Filter data by customer name
   * @param {Array} data - Array of booking objects
   * @param {string} searchTerm - Customer name search term
   * @returns {Array} Filtered data
   */
  filterByCustomer(data, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return data;
    console.log(`[FilterService] Filtering by customer: ${searchTerm}`);
    
    const term = searchTerm.toLowerCase();
    
    return data.filter(booking => {
      const customerName = booking['Customer Name'];
      return customerName && String(customerName).toLowerCase().includes(term);
    });
  },

  /**
   * Filter data by balance
   * @param {Array} data - Array of booking objects
   * @param {boolean} showOutstanding - Whether to show only outstanding balance
   * @returns {Array} Filtered data
   */
  filterByBalance(data, showOutstanding) {
    if (!showOutstanding) return data;
    console.log('[FilterService] Filtering for outstanding balance');
    
    return data.filter(booking => Number(booking["Balance"]) > 0);
  },

  /**
   * Filter data by booking reference
   * @param {Array} data - Array of booking objects
   * @param {string} refValue - Booking reference to filter by
   * @returns {Array} Filtered data
   */
  filterByBookingRef(data, refValue) {
    if (!refValue || refValue.length < 3) {
      console.warn('[FilterService] Booking reference too short, returning all data');
      return data;
    }
    console.log(`[FilterService] Filtering by booking reference: ${refValue}`);
    
    // Clean up booking reference for filtering        
    const searchValue = refValue.toUpperCase().trim();

    return data.filter(booking => {
      const bookingRef = booking['Booking Reference'];
      return bookingRef && String(bookingRef).includes(searchValue);
    });
  },

  /**
   * Filter data by phone number
   * @param {Array} data - Array of booking objects
   * @param {string} phoneNumber - Phone number to filter by
   * @returns {Array} Filtered data
   */
  filterByPhone(data, phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 9) {
      console.warn('[FilterService] Phone number too short, returning all data');
      return data;
    }
    console.log(`[FilterService] Filtering by phone number: ${phoneNumber}`);
    
    // Clean up phone number for filtering
    const searchValue = String(phoneNumber).replace(/\D/g, '');
    
    return data.filter(booking => {
      const phone = String(booking['Phone'] || '').replace(/\D/g, '');
      return phone.includes(searchValue);
    });
  },
  
  /**
   * Clear the filter cache
   */
  clearCache() {
    filterCache.clear();
    console.log('[FilterService] Filter cache cleared');
  },
  
  /**
   * Combined filtering function to apply multiple filters at once
   * @param {Array} data - Original data array
   * @param {Object} filters - Object containing filter types and values
   * @returns {Array} Filtered data
   */
  applyMultipleFilters(data, filters) {
    console.log('[FilterService] Applying multiple filters', filters);
    
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }
    
    try {
      let filteredData = [...data];
      
      // Apply each filter in sequence
      for (const [filterType, filterValue] of Object.entries(filters)) {
        if (FilterConfig[filterType] && filterValue) {
          filteredData = this.applyFilters(filteredData, filterType, filterValue);
        }
      }
      
      console.log(`[FilterService] Multiple filters applied. Results: ${filteredData.length} records`);
      return filteredData;
    } catch (error) {
      console.error(`[FilterService] Error applying multiple filters: ${error.message}`);
      throw new Error(`Failed to apply multiple filters: ${error.message}`);
    }
  }
};