/**
 * Utility functions for data processing and manipulation
 * @module dataUtils
 */
export const dataUtils = {
    /**
     * Get unique values from array of objects
     * @param {Array} data - Array of objects
     * @param {string} field - Field to extract values from
     * @returns {Array} Array of unique values
     */
    getUniqueValues: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to getUniqueValues');
        return [];
      }
      
      try {
        return [...new Set(data.map(item => item[field]))]
          .filter(Boolean)
          .sort();
      } catch (error) {
        console.error(`[dataUtils] Error getting unique values: ${error.message}`);
        return [];
      }
    },
  
    /**
     * Group data by field
     * @param {Array} data - Array of objects
     * @param {string} field - Field to group by
     * @returns {Object} Grouped data object
     */
    groupBy: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to groupBy');
        return {};
      }
      
      try {
        return data.reduce((acc, item) => {
          const key = item[field];
          if (key === undefined || key === null) return acc;
          
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});
      } catch (error) {
        console.error(`[dataUtils] Error grouping data: ${error.message}`);
        return {};
      }
    },
  
    /**
     * Calculate sum of field values
     * @param {Array} data - Array of objects
     * @param {string} field - Field to sum
     * @returns {number} Sum of values
     */
    sum: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to sum');
        return 0;
      }
      
      try {
        return data.reduce((sum, item) => {
          const value = item[field];
          
          // Skip undefined or null values
          if (value === undefined || value === null || value === '') {
            return sum;
          }
          
          // Handle currency strings (remove ₹ and commas)
          if (typeof value === 'string') {
            // Replace currency symbols and commas
            const sanitized = value.replace(/[₹,]/g, '').trim();
            const parsed = parseFloat(sanitized);
            return sum + (isNaN(parsed) ? 0 : parsed);
          }
          
          // Handle numeric values
          const numValue = typeof value === 'number' ? value : Number(value);
          return sum + (isNaN(numValue) ? 0 : numValue);
        }, 0);
      } catch (error) {
        console.error(`[dataUtils] Error calculating sum: ${error.message}`);
        return 0;
      }
    },
  
    /**
     * Calculate average of field values
     * @param {Array} data - Array of objects
     * @param {string} field - Field to average
     * @returns {number} Average value
     */
    average: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to average');
        return 0;
      }
      
      try {
        const sum = dataUtils.sum(data, field);
        return data.length ? sum / data.length : 0;
      } catch (error) {
        console.error(`[dataUtils] Error calculating average: ${error.message}`);
        return 0;
      }
    },
  
    /**
     * Find most frequent value in field
     * @param {Array} data - Array of objects
     * @param {string} field - Field to analyze
     * @returns {*} Most frequent value
     */
    mostFrequent: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to mostFrequent');
        return null;
      }
      
      try {
        const counts = data.reduce((acc, item) => {
          const value = item[field];
          if (value === undefined || value === null) return acc;
          
          const valueStr = String(value);
          acc[valueStr] = (acc[valueStr] || 0) + 1;
          return acc;
        }, {});
        
        if (Object.keys(counts).length === 0) return null;
        
        return Object.entries(counts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
      } catch (error) {
        console.error(`[dataUtils] Error finding most frequent value: ${error.message}`);
        return null;
      }
    },
    
    /**
     * Filter data by search term across multiple fields
     * @param {Array} data - Data array to filter
     * @param {string} term - Search term
     * @param {Array} fields - Fields to search in
     * @returns {Array} Filtered data
     */
    search: (data, term, fields) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to search');
        return [];
      }
      
      if (!term || !fields || !fields.length) {
        console.warn('[dataUtils] No search term or fields provided');
        return data;
      }
      
      try {
        const lowerTerm = String(term).toLowerCase();
        return data.filter(item => 
          fields.some(field => {
            const value = item[field];
            return value !== undefined && 
                   value !== null && 
                   String(value).toLowerCase().includes(lowerTerm);
          })
        );
      } catch (error) {
        console.error(`[dataUtils] Error searching data: ${error.message}`);
        return data;
      }
    },
    
    /**
     * Sort data by field
     * @param {Array} data - Data array to sort
     * @param {string} field - Field to sort by
     * @param {boolean} ascending - Sort direction
     * @returns {Array} Sorted data
     */
    sortBy: (data, field, ascending = true) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to sortBy');
        return [];
      }
      
      if (!field) {
        console.warn('[dataUtils] No field provided to sortBy');
        return [...data];
      }
      
      try {
        return [...data].sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          
          // Handle undefined or null values
          if (valA === undefined || valA === null) return ascending ? -1 : 1;
          if (valB === undefined || valB === null) return ascending ? 1 : -1;
          
          // Handle numbers
          if (typeof valA === 'number' && typeof valB === 'number') {
            return ascending ? valA - valB : valB - valA;
          }
          
          // Handle strings
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
      } catch (error) {
        console.error(`[dataUtils] Error sorting data: ${error.message}`);
        return [...data];
      }
    },
    
    /**
     * Get min value from field
     * @param {Array} data - Data array
     * @param {string} field - Field to check
     * @returns {number} Minimum value
     */
    min: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to min');
        return 0;
      }
      
      try {
        const values = data
          .map(item => Number(item[field]))
          .filter(value => !isNaN(value));
          
        return values.length > 0 ? Math.min(...values) : 0;
      } catch (error) {
        console.error(`[dataUtils] Error finding min value: ${error.message}`);
        return 0;
      }
    },
    
    /**
     * Get max value from field
     * @param {Array} data - Data array
     * @param {string} field - Field to check
     * @returns {number} Maximum value
     */
    max: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to max');
        return 0;
      }
      
      try {
        const values = data
          .map(item => Number(item[field]))
          .filter(value => !isNaN(value));
          
        return values.length > 0 ? Math.max(...values) : 0;
      } catch (error) {
        console.error(`[dataUtils] Error finding max value: ${error.message}`);
        return 0;
      }
    },
    
    /**
     * Create a frequency distribution of values
     * @param {Array} data - Data array
     * @param {string} field - Field to analyze
     * @returns {Object} Value frequency counts
     */
    valueDistribution: (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[dataUtils] No data provided to valueDistribution');
        return {};
      }
      
      try {
        return data.reduce((acc, item) => {
          const value = item[field];
          if (value === undefined || value === null) return acc;
          
          const valueStr = String(value);
          acc[valueStr] = (acc[valueStr] || 0) + 1;
          return acc;
        }, {});
      } catch (error) {
        console.error(`[dataUtils] Error creating value distribution: ${error.message}`);
        return {};
      }
    },

    /**
     * Format a number with commas and optional decimal places
     * @param {number} value - Number to format
     * @param {number} [decimals=0] - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber: (value, decimals = 0) => {
      if (value === undefined || value === null || isNaN(value)) {
        return '0';
      }
      
      try {
        // Round to specified decimal places
        const roundedValue = Number(value).toFixed(decimals);
        
        // Split into whole and decimal parts
        const [whole, decimal] = roundedValue.split('.');
        
        // Add commas to whole number part
        const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Return with decimal part if it exists
        return decimal ? `${withCommas}.${decimal}` : withCommas;
      } catch (error) {
        console.error(`[dataUtils] Error formatting number: ${error.message}`);
        return '0';
      }
    },

    /**
     * Format a currency value
     * @param {number} value - Value to format
     * @returns {string} Formatted currency string
     */
    formatCurrency: (value) => {
      if (value === undefined || value === null || isNaN(value)) {
        return '₹0';
      }
      
      try {
        return `₹${dataUtils.formatNumber(value)}`;
      } catch (error) {
        console.error(`[dataUtils] Error formatting currency: ${error.message}`);
        return '₹0';
      }
    },

    /**
     * Format a percentage value
     * @param {number} value - Value to format
     * @param {number} [decimals=0] - Number of decimal places
     * @returns {string} Formatted percentage string
     */
    formatPercentage: (value, decimals = 0) => {
      if (value === undefined || value === null || isNaN(value)) {
        return '0%';
      }
      
      try {
        return `${dataUtils.formatNumber(value, decimals)}%`;
      } catch (error) {
        console.error(`[dataUtils] Error formatting percentage: ${error.message}`);
        return '0%';
      }
    }
  };
  
  console.log('[dataUtils] Loaded successfully');