import { parseDate } from '../utils/dateUtils';
import { CONSTANTS } from '../utils/constants';

/**
 * Service for sorting data by various criteria
 */
export const sortService = {
  /**
   * Sort data based on field and direction
   * @param {Array} data - Data array to sort
   * @param {string} field - Field to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted data array
   */
  sortData(data, field, direction) {
    console.log(`[SortService] Sorting data by ${field} in ${direction} order`);
    
    if (!data || !data.length || !field) {
      console.warn('[SortService] Invalid data or field for sorting');
      return data;
    }
    
    try {
      return [...data].sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];
        
        // Handle cases where values might be undefined or null
        if (valueA === undefined || valueA === null) return direction === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null) return direction === 'asc' ? 1 : -1;
        
        // Handle numeric values
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Handle date values (check if it matches date format DD/MM/YYYY)
        if (typeof valueA === 'string' && typeof valueB === 'string' && 
            /^\d{2}\/\d{2}\/\d{4}$/.test(valueA) && /^\d{2}\/\d{2}\/\d{4}$/.test(valueB)) {
          // Convert to date objects for comparison
          const dateA = parseDate(valueA);
          const dateB = parseDate(valueB);
          if (dateA && dateB) {
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
          }
        }
        
        // Handle currency values (values starting with currency symbol)
        if (typeof valueA === 'string' && typeof valueB === 'string' &&
            valueA.startsWith(CONSTANTS.CURRENCY_SYMBOL) && valueB.startsWith(CONSTANTS.CURRENCY_SYMBOL)) {
          const numA = parseFloat(valueA.replace(CONSTANTS.CURRENCY_SYMBOL, '').replace(/,/g, '')) || 0;
          const numB = parseFloat(valueB.replace(CONSTANTS.CURRENCY_SYMBOL, '').replace(/,/g, '')) || 0;
          return direction === 'asc' ? numA - numB : numB - numA;
        }
        
        // Handle string values (case-insensitive)
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        
        return direction === 'asc' ? 
            strA.localeCompare(strB) : 
            strB.localeCompare(strA);
      });
    } catch (error) {
      console.error(`[SortService] Error sorting data: ${error.message}`);
      return data; // Return unsorted data on error
    }
  },
  
  /**
   * Get the next sort direction based on current state
   * @param {string} currentField - Current sort field
   * @param {string} newField - New sort field
   * @param {string} currentDirection - Current sort direction
   * @returns {string} Next sort direction
   */
  getNextSortDirection(currentField, newField, currentDirection) {
    console.log(`[SortService] Getting next direction. Current field: ${currentField}, New field: ${newField}, Current direction: ${currentDirection}`);
    
    // If clicking a new field, start with descending
    if (currentField !== newField) {
      return 'desc';
    }
    
    // If clicking the same field, toggle direction
    return currentDirection === 'asc' ? 'desc' : 'asc';
  },
  
  /**
   * Sort data by multiple fields
   * @param {Array} data - Data array to sort
   * @param {Array} sortConfig - Array of sort configurations
   * @returns {Array} Sorted data array
   */
  sortByMultipleFields(data, sortConfig) {
    if (!data || !data.length || !sortConfig || !sortConfig.length) {
      return data;
    }
    
    return [...data].sort((a, b) => {
      for (const config of sortConfig) {
        const { field, direction } = config;
        const valueA = a[field];
        const valueB = b[field];
        
        // Skip if both values are undefined/null
        if ((valueA === undefined || valueA === null) && 
            (valueB === undefined || valueB === null)) {
          continue;
        }
        
        // Handle cases where only one value is undefined/null
        if (valueA === undefined || valueA === null) return direction === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null) return direction === 'asc' ? 1 : -1;
        
        // Compare values based on their type
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          const result = valueA - valueB;
          if (result !== 0) {
            return direction === 'asc' ? result : -result;
          }
        } else if (valueA instanceof Date && valueB instanceof Date) {
          const result = valueA - valueB;
          if (result !== 0) {
            return direction === 'asc' ? result : -result;
          }
        } else {
          const strA = String(valueA).toLowerCase();
          const strB = String(valueB).toLowerCase();
          const result = strA.localeCompare(strB);
          if (result !== 0) {
            return direction === 'asc' ? result : -result;
          }
        }
      }
      
      // If all fields are equal, maintain original order
      return 0;
    });
  },
  
  /**
   * Sort months in financial year order (April to March)
   * @param {Array<Array>} entries - Array of [key, value] entries where key is a month string
   * @returns {Array<Array>} Sorted entries
   */
  sortMonthsInFinancialYearOrder(entries) {
    console.log('[SortService] Sorting months in financial year order');
    
    // Define month order for financial year (April to March)
    const monthOrder = [
      'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December', 'January', 'February', 'March'
    ];
    
    // Extract month and year from month string (e.g., "April 2024")
    const extractMonthAndYear = (monthStr) => {
      const parts = monthStr.split(' ');
      return {
        month: parts[0],
        year: parseInt(parts[1] || '0', 10)
      };
    };
    
    // Sort entries by financial year month order
    return [...entries].sort(([a], [b]) => {
      const monthA = extractMonthAndYear(a);
      const monthB = extractMonthAndYear(b);
      
      // If years are different, sort by year first
      if (monthA.year !== monthB.year) {
        return monthA.year - monthB.year;
      }
      
      // If years are the same, sort by month order
      return monthOrder.indexOf(monthA.month) - monthOrder.indexOf(monthB.month);
    });
  },
  
  /**
   * Determine the data type of a field from sample data
   * @param {Array} data - Data array to analyze
   * @param {string} field - Field to analyze
   * @returns {string} Detected data type ('number', 'date', 'currency', 'string')
   */
  detectFieldType(data, field) {
    if (!data || !data.length || !field) {
      return 'string';
    }
    
    // Get first non-null value
    let sampleValue = null;
    for (const item of data) {
      if (item[field] !== null && item[field] !== undefined) {
        sampleValue = item[field];
        break;
      }
    }
    
    if (sampleValue === null) {
      return 'string';
    }
    
    // Check type
    if (typeof sampleValue === 'number') {
      return 'number';
    }
    
    if (typeof sampleValue === 'string') {
      // Check if date
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(sampleValue)) {
        return 'date';
      }
      
      // Check if currency
      if (sampleValue.startsWith(CONSTANTS.CURRENCY_SYMBOL)) {
        return 'currency';
      }
    }
    
    return 'string';
  }
};