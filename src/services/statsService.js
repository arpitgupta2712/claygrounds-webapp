import { dataUtils } from '../utils/dataUtils';
import { categoryConfigs } from '../utils/constants';

// Cache for statistics calculations
const statsCache = new Map();

/**
 * Service for statistical calculations and data analysis
 */
export const statsService = {
  /**
   * Calculate summary statistics for booking data with caching
   * @param {Array} data - Array of booking objects
   * @param {string} year - The year of the data
   * @returns {Object|null} Summary statistics or null if no data
   */
  calculateSummaryStats(data, year) {
    // Generate a cache key based on data length, first/last item, and year
    if (!data || !data.length) {
      console.warn('[StatsService] No data provided for statistics calculation');
      return null;
    }
    
    const cacheKey = `stats_${year}_${data.length}_${data[0]?.['S no']}_${data[data.length-1]?.['S no']}`;
    
    // Check cache
    if (statsCache.has(cacheKey)) {
      console.log('[StatsService] Returning cached statistics');
      return statsCache.get(cacheKey);
    }
    
    console.log('[StatsService] Calculating summary statistics');

    try {
      const stats = {
        totalBookings: data.length,
        totalCollection: dataUtils.sum(data, 'Total Paid'),
        totalSlots: dataUtils.sum(data, 'Number of slots'),
        uniqueCustomers: new Set(data
          .map(booking => {
            const phone = booking["Phone"];
            if (!phone) return null;
            // Convert to string and normalize phone number by removing spaces, dashes, and other non-digit characters
            return String(phone).replace(/\D/g, '');
          })
          .filter(Boolean)).size,
        totalBalance: dataUtils.sum(data, 'Balance'),
        avgRevenuePerSlot: this.calculateAverage(data, 'Total Paid', 'Number of slots'),
        completionRate: this.calculateCompletionRate(data)
      };
      
      // Add additional stats
      stats.avgBookingValue = stats.totalBookings ? stats.totalCollection / stats.totalBookings : 0;
      stats.paymentRate = stats.totalCollection ? ((stats.totalCollection - stats.totalBalance) / stats.totalCollection) * 100 : 0;

      console.log('[StatsService] Statistics calculated successfully');
      
      // Cache the result
      statsCache.set(cacheKey, stats);
      
      // Limit cache size
      if (statsCache.size > 20) {
        const oldestKey = statsCache.keys().next().value;
        statsCache.delete(oldestKey);
      }
      
      return stats;
    } catch (error) {
      console.error(`[StatsService] Error calculating statistics: ${error.message}`);
      throw new Error(`Failed to calculate statistics: ${error.message}`);
    }
  },

  /**
   * Calculate statistics for a specific category
   * @param {Array} data - Array of booking objects
   * @param {string} category - Category value
   * @param {Object} config - Category configuration
   * @param {string} year - The year of the data
   * @returns {Object} Category statistics
   */
  calculateCategoryStats(data, category, config, year) {
    console.log(`[StatsService] Calculating stats for category: ${category}`);
    
    try {
      const categoryBookings = data.filter(booking => 
        booking[config.valueField] === category
      );
      
      // Return default stats if no bookings found
      if (!categoryBookings || categoryBookings.length === 0) {
        return {
          totalBookings: 0,
          totalCollection: 0,
          totalSlots: 0,
          uniqueCustomers: 0,
          totalBalance: 0,
          avgRevenuePerSlot: 0,
          completionRate: 0,
          avgBookingValue: 0,
          paymentRate: 0
        };
      }
      
      const baseStats = this.calculateSummaryStats(categoryBookings, year);
      const extraStats = {};

      if (config.extraStats) {
        config.extraStats.forEach(stat => {
          extraStats[stat.label] = stat.calculate(categoryBookings);
        });
      }

      console.log(`[StatsService] Category stats calculated for: ${category}`);
      return { ...baseStats, ...extraStats };
    } catch (error) {
      console.error(`[StatsService] Error calculating category stats for ${category}: ${error.message}`);
      throw new Error(`Failed to calculate category statistics: ${error.message}`);
    }
  },

  /**
   * Calculate average for specified fields
   * @param {Array} data - Array of booking objects
   * @param {string} valueField - Field to sum
   * @param {string} countField - Field to count
   * @returns {number} Calculated average
   */
  calculateAverage(data, valueField, countField) {
    const totalValue = dataUtils.sum(data, valueField);
    const totalCount = dataUtils.sum(data, countField);
    return totalCount ? totalValue / totalCount : 0;
  },

  /**
   * Calculate booking completion rate
   * @param {Array} data - Array of booking objects
   * @returns {number} Completion rate percentage
   */
  calculateCompletionRate(data) {
    const completed = data.filter(booking => booking.Status === 'Confirmed').length;
    return data.length ? (completed / data.length) * 100 : 0;
  },
  
  /**
   * Calculate total revenue by payment method
   * @param {Array} data - Array of booking objects
   * @returns {Object} Revenue by payment method
   */
  calculateRevenueByPaymentMethod(data) {
    const paymentMethods = [
      'Cash', 'UPI', 'Bank Transfer', 'Hudle App', 
      'Hudle QR', 'Hudle Wallet', 'Venue Wallet'
    ];
    
    const result = {};
    
    paymentMethods.forEach(method => {
      result[method] = dataUtils.sum(data, method);
    });
    
    return result;
  },
  
  /**
   * Calculate booking distribution by time of day
   * @param {Array} data - Array of booking objects
   * @returns {Object} Booking counts by time period
   */
  calculateTimeDistribution(data) {
    const timeDistribution = {
      peakHours: 0,     // 6:00 PM - 11:00 PM
      nonPeakHours: 0   // 11:00 PM - 6:00 PM next day
    };
    
    // Track total valid bookings with time information
    let totalBookingsWithTime = 0;
    
    data.forEach(booking => {
      const timeStr = booking['Slot Time'];
      if (!timeStr) return;
      
      totalBookingsWithTime++;
      
      // Parse time string (format: "hh:mm AM/PM")
      const [time, period] = timeStr.split(' ');
      const [hourStr] = time.split(':');
      let hour = parseInt(hourStr, 10);
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      // Peak hours: 6 PM (18) to 11 PM (23)
      if (hour >= 18 && hour < 23) {
        timeDistribution.peakHours++;
      } else {
        timeDistribution.nonPeakHours++;
      }
    });
    
    // Add percentage data
    if (totalBookingsWithTime > 0) {
      timeDistribution.peakHoursPercentage = Math.round((timeDistribution.peakHours / totalBookingsWithTime) * 100);
      timeDistribution.nonPeakHoursPercentage = Math.round((timeDistribution.nonPeakHours / totalBookingsWithTime) * 100);
    }
    
    return timeDistribution;
  },
  
  /**
   * Calculate top customers by booking count or revenue
   * @param {Array} data - Array of booking objects
   * @param {string} [metric='count'] - Metric to rank by ('count' or 'revenue')
   * @param {number} [limit=5] - Number of top customers to return
   * @returns {Array} Top customers with statistics
   */
  calculateTopCustomers(data, metric = 'count', limit = 5) {
    const customerMap = new Map();
    
    // Group data by customer
    data.forEach(booking => {
      const customerId = booking['Customer ID'] || booking['Phone'];
      if (!customerId) return;
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: booking['Customer Name'] || 'Unknown',
          phone: booking['Phone'] || 'N/A',
          bookingCount: 0,
          totalCollection: 0,
          bookings: []
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.bookingCount++;
      customer.totalCollection += Number(booking['Total Paid']) || 0;
      customer.bookings.push(booking);
    });
    
    // Convert map to array and sort by specified metric
    return Array.from(customerMap.values())
      .sort((a, b) => {
        if (metric === 'revenue') {
          return b.totalCollection - a.totalCollection;
        }
        return b.bookingCount - a.bookingCount;
      })
      .slice(0, limit);
  },
  
  /**
   * Clear cache for a specific year
   * @param {string} year - The year to clear cache for
   */
  clearCacheForYear(year) {
    const keysToDelete = Array.from(statsCache.keys())
      .filter(key => key.startsWith(`stats_${year}_`));
    
    keysToDelete.forEach(key => statsCache.delete(key));
    console.log(`[StatsService] Cleared cache for year: ${year}`);
  },
  
  /**
   * Clear the statistics cache
   */
  clearCache() {
    statsCache.clear();
    console.log('[StatsService] Statistics cache cleared');
  },

  /**
   * Calculate monthly payment statistics
   * @param {Array} data - Array of booking objects
   * @returns {Array} Monthly payment statistics
   */
  calculateMonthlyPayments(data) {
    const months = [
      'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December', 'January', 'February', 'March'
    ];
    
    return months.map(month => {
      const monthData = data.filter(booking => booking.Month === month);
      const year = monthData.length > 0 ? monthData[0].Year : '';
      
      // Helper function to safely sum values
      const safeSum = (fieldName) => {
        return monthData.reduce((sum, booking) => {
          const value = parseFloat(booking[fieldName]) || 0;
          return sum + value;
        }, 0);
      };

      // Calculate payment amounts with safe summation
      const cashAmount = safeSum('Cash');
      const bankAmount = safeSum('UPI') + safeSum('Bank Transfer');
      const hudleAmount = safeSum('Hudle App') + 
                         safeSum('Hudle QR') + 
                         safeSum('Hudle Discount') + 
                         safeSum('Hudle Pass') + 
                         safeSum('Venue Wallet') + 
                         safeSum('Hudle Wallet');
      
      const totalAmount = cashAmount + bankAmount + hudleAmount;
      
      return {
        month,
        year,
        cashAmount,
        bankAmount,
        hudleAmount,
        totalAmount,
        cashPercentage: totalAmount > 0 ? Math.round((cashAmount / totalAmount) * 100) : 0,
        bankPercentage: totalAmount > 0 ? Math.round((bankAmount / totalAmount) * 100) : 0,
        hudlePercentage: totalAmount > 0 ? Math.round((hudleAmount / totalAmount) * 100) : 0
      };
    });
  }
};

/**
 * Memoized version for performance-critical calls
 * @param {Array} data - Array of booking objects 
 * @param {string} category - Category value
 * @param {Object} config - Category configuration
 * @returns {Object} Category statistics
 */
export const memoizedCategoryStats = (data, category, config) => {
  // Simple memoization
  const cacheKey = `${category}_${data.length}`;
  if (statsCache.has(cacheKey)) {
    return statsCache.get(cacheKey);
  }
  
  const result = statsService.calculateCategoryStats(data, category, config);
  statsCache.set(cacheKey, result);
  return result;
};