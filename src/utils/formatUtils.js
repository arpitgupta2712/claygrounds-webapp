import { CONSTANTS } from './constants';

/**
 * Utility functions for data formatting and display
 * @module formatUtils
 */
export const formatUtils = {
  /**
   * Format currency amount
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  currency: (amount) => {
    if (!amount) return `${CONSTANTS.CURRENCY_SYMBOL}0`;
    return `${CONSTANTS.CURRENCY_SYMBOL}${Number(amount).toLocaleString(CONSTANTS.CURRENCY_LOCALE)}`;
  },

  /**
   * Format date string to application format
   * @param {string} dateStr - Date string in DD/MM/YYYY format
   * @returns {string} Date in YYYY-MM-DD format
   */
  date: (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  },

  /**
   * Format percentage value
   * @param {number} value - Value to format as percentage
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  percentage: (value, decimals = 1) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format number with thousand separators
   * @param {number|string} value - Number to format
   * @returns {string} Formatted number string
   */
  number: (value) => {
    if (typeof value !== 'number' && !value) return '0';
    return Number(value).toLocaleString(CONSTANTS.CURRENCY_LOCALE);
  },
  
  /**
   * Format phone number
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  phone: (phone) => {
    if (!phone) return '';
    // Format as per Indian phone number standard
    const numStr = String(phone).replace(/\D/g, '');
    if (numStr.length === 10) {
      return `${numStr.slice(0, 3)}-${numStr.slice(3, 6)}-${numStr.slice(6)}`;
    }
    return numStr;
  },
  
  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  truncate: (text, length = 20) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  
  /**
   * Format date for display
   * @param {string} dateStr - Date string in any format
   * @param {string} format - Format type ('short', 'medium', 'long')
   * @returns {string} Formatted date string
   */
  formatDateForDisplay: (dateStr, format = 'medium') => {
    if (!dateStr) return '';
    
    try {
      let date;
      
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        date = new Date(year, month - 1, day);
      } else {
        // Handle other formats
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) return dateStr;
      
      // Format based on requested format
      switch (format) {
        case 'short':
          return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        case 'medium':
          return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        case 'long':
          return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
        case 'default':
          // Explicitly format as DD/MM/YYYY
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        default:
          // Default to DD/MM/YYYY format
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear();
          return `${d}/${m}/${y}`;
      }
    } catch (error) {
      console.error(`[formatUtils] Error formatting date: ${error.message}`);
      return dateStr;
    }
  }
};