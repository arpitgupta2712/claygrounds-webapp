/**
 * Utility functions for date handling and manipulation
 * @module dateUtils
 */

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null
 */
export function parseDate(dateStr) {
    if (!dateStr) return null;
    try {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error(`[dateUtils] Error parsing date "${dateStr}":`, error);
      return null;
    }
  }
  
  /**
   * Format Date object to DD/MM/YYYY string
   * @param {Date} date - Date object
   * @returns {string} Date string in DD/MM/YYYY format
   */
  export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    try {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error(`[dateUtils] Error formatting date:`, error);
      return '';
    }
  }
  
  /**
   * Check if date is within range
   * @param {string} date - Date string to check (DD/MM/YYYY)
   * @param {string} startDate - Start date of range (DD/MM/YYYY)
   * @param {string} endDate - End date of range (DD/MM/YYYY)
   * @returns {boolean} Whether date is in range
   */
  export function isDateInRange(date, startDate, endDate) {
    try {
      const checkDate = parseDate(date);
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      
      if (!checkDate) return false;
      if (start && end) return checkDate >= start && checkDate <= end;
      if (start) return checkDate >= start;
      if (end) return checkDate <= end;
      return true;
    } catch (error) {
      console.error(`[dateUtils] Error checking date range:`, error);
      return false;
    }
  }
  
  /**
   * Get month name from date
   * @param {Date} date - Date object
   * @returns {string} Month name
   */
  export function getMonthName(date) {
    try {
      return date instanceof Date ? 
        date.toLocaleString('en-US', { month: 'long' }) : '';
    } catch (error) {
      console.error(`[dateUtils] Error getting month name:`, error);
      return '';
    }
  }
  
  /**
   * Get days difference between two dates
   * @param {Date|string} date1 - First date
   * @param {Date|string} date2 - Second date
   * @returns {number} Number of days difference
   */
  export function daysDifference(date1, date2) {
    try {
      const d1 = date1 instanceof Date ? date1 : parseDate(date1);
      const d2 = date2 instanceof Date ? date2 : parseDate(date2);
      
      if (!d1 || !d2) return 0;
      
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error(`[dateUtils] Error calculating days difference:`, error);
      return 0;
    }
  }
  
  /**
   * Check if date is today
   * @param {Date|string} date - Date to check
   * @returns {boolean} Whether date is today
   */
  export function isToday(date) {
    try {
      const d = date instanceof Date ? date : parseDate(date);
      if (!d) return false;
      
      const today = new Date();
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    } catch (error) {
      console.error(`[dateUtils] Error checking if date is today:`, error);
      return false;
    }
  }
  
  /**
   * Format date to local display format
   * @param {string|Date} date - Date to format
   * @param {string} format - Format type (short, medium, long)
   * @returns {string} Formatted date
   */
  export function formatDisplayDate(date, format = 'medium') {
    try {
      let dateObj;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' && date.includes('/')) {
        dateObj = parseDate(date);
      } else {
        dateObj = new Date(date);
      }
      
      if (!dateObj || isNaN(dateObj)) return String(date || '');
      
      const options = {
        short: { day: 'numeric', month: 'short' },
        medium: { day: 'numeric', month: 'short', year: 'numeric' },
        long: { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
      };
      
      return dateObj.toLocaleDateString('en-IN', options[format] || options.medium);
    } catch (error) {
      console.error(`[dateUtils] Error formatting display date:`, error);
      return String(date || '');
    }
  }
  
  /**
   * Get fiscal year quarter from date
   * @param {Date|string} date - Date to check
   * @returns {number} Quarter (1-4)
   */
  export function getFiscalQuarter(date) {
    try {
      const d = date instanceof Date ? date : parseDate(date);
      if (!d) return 0;
      
      // Assuming fiscal year starts in April
      const month = d.getMonth();
      
      if (month >= 3 && month <= 5) return 1;     // Apr-Jun (Q1)
      if (month >= 6 && month <= 8) return 2;     // Jul-Sep (Q2)
      if (month >= 9 && month <= 11) return 3;    // Oct-Dec (Q3)
      return 4;                                   // Jan-Mar (Q4)
    } catch (error) {
      console.error(`[dateUtils] Error getting fiscal quarter:`, error);
      return 0;
    }
  }
  
  /**
 * Get financial year string from a date
 * @param {Date|string} date - Date to get financial year for
 * @returns {string} Financial year in "YYYY-YY" format (e.g., "2024-25")
 */
export function getFinancialYear(date) {
  try {
    const d = date instanceof Date ? date : parseDate(date);
    if (!d) return '';
    
    const month = d.getMonth(); // 0-11 (Jan-Dec)
    const year = d.getFullYear();
    
    // If month is Jan-Mar (0-2), it's the latter part of the financial year
    if (month >= 0 && month <= 2) {
      return `${year-1}-${year.toString().slice(2)}`;
    }
    // If month is Apr-Dec (3-11), it's the first part of the financial year
    return `${year}-${(year+1).toString().slice(2)}`;
  } catch (error) {
    console.error(`[dateUtils] Error getting financial year:`, error);
    return '';
  }
}

/**
 * Check if a date falls within a financial year
 * @param {Date|string} date - Date to check
 * @param {string} financialYear - Financial year in "YYYY-YY" format (e.g., "2024-25") or "YYYYYY" format
 * @returns {boolean} Whether date falls within the financial year
 */
export function isInFinancialYear(date, financialYear) {
  try {
    const d = date instanceof Date ? date : parseDate(date);
    if (!d || !financialYear) return false;
    
    // Check if financialYear has the right format (might be missing the hyphen)
    let formattedYear = financialYear;
    if (!financialYear.includes('-')) {
      // Convert from "202425" to "2024-25" format
      const startYear = financialYear.substring(0, 4);
      const endYear = financialYear.substring(4, 6);
      formattedYear = `${startYear}-${endYear}`;
    }
    
    const [startYear] = formattedYear.split('-');
    const startDate = new Date(startYear, 3, 1); // April 1st of start year
    const endDate = new Date(Number(startYear) + 1, 2, 31); // March 31st of next year
    
    return d >= startDate && d <= endDate;
  } catch (error) {
    console.error(`[dateUtils] Error checking financial year:`, error);
    return false;
  }
}

/**
 * Get start and end dates of a financial year
 * @param {string} financialYear - Financial year in "YYYY-YY" format (e.g., "2024-25") or "YYYYYY" format
 * @returns {Object} Object with start and end dates
 */
export function getFinancialYearDates(financialYear) {
  try {
    if (!financialYear) return { start: null, end: null };
    
    // Check if financialYear has the right format (might be missing the hyphen)
    let formattedYear = financialYear;
    if (!financialYear.includes('-')) {
      // Convert from "202425" to "2024-25" format
      const startYear = financialYear.substring(0, 4);
      const endYear = financialYear.substring(4, 6);
      formattedYear = `${startYear}-${endYear}`;
    }
    
    const [startYear] = formattedYear.split('-');
    const start = new Date(startYear, 3, 1); // April 1st
    const end = new Date(Number(startYear) + 1, 2, 31); // March 31st of next year
    
    return {
      start: formatDate(start),
      end: formatDate(end)
    };
  } catch (error) {
    console.error(`[dateUtils] Error getting financial year dates:`, error);
    return { start: null, end: null };
  }
}