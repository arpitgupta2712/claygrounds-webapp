import { dataUtils } from '../utils/dataUtils';
import { categoryConfigs } from '../utils/constants';
import { groupingService } from './groupingService';

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
    if (!data || !data.length) {
      console.warn('[StatsService] No data provided for statistics calculation');
      return null;
    }
    
    // Generate cache key
    const cacheKey = `stats_${year}_${data.length}_${data[0]?.['S no']}_${data[data.length-1]?.['S no']}`;
    
    // Check cache
    if (statsCache.has(cacheKey)) {
      console.log('[StatsService] Returning cached statistics');
      return statsCache.get(cacheKey);
    }
    
    console.log('[StatsService] Calculating summary statistics');

    try {
      // Group data by different parameters
      const byLocation = groupingService.groupByLocation(data);
      const bySource = groupingService.groupBySource(data);
      const byStatus = groupingService.groupByStatus(data);
      const byPaymentMode = groupingService.groupByPaymentMode(data);
      const byMonth = groupingService.groupByDate(data, 'month');
      
      // Calculate base statistics
      const stats = {
        totalBookings: data.length,
        totalCollection: dataUtils.sum(data, 'Total Paid'),
        totalSlots: dataUtils.sum(data, 'Number of slots'),
        uniqueCustomers: new Set(data.map(b => b.Phone)).size,
        totalBalance: dataUtils.sum(data, 'Balance'),
        avgRevenuePerSlot: this.calculateAverage(data, 'Total Paid', 'Number of slots'),
        completionRate: this.calculateCompletionRate(data)
      };
      
      // Add source-based stats
      stats.sourceStats = {
        online: (bySource.online || []).length,
        offline: (bySource.offline || []).length,
        onlinePercentage: data.length ? ((bySource.online || []).length / data.length) * 100 : 0
      };
      
      // Add status-based stats
      stats.statusStats = {
        confirmed: (byStatus.confirmed || []).length,
        cancelled: (byStatus.cancelled || []).length,
        partially_cancelled: (byStatus.partially_cancelled || []).length,
        confirmationRate: data.length ? ((byStatus.confirmed || []).length / data.length) * 100 : 0
      };
      
      // ----- PAYMENT CALCULATION USING DIRECT APPROACH -----
      // Helper function to safely parse currency values
      const getCurrencyValueSum = (fieldName) => {
        return data.reduce((total, booking) => {
          // Get the value from the booking
          const value = booking[fieldName];
          
          // Skip undefined, null or empty values
          if (value === undefined || value === null || value === '') {
            return total;
          }
          
          // Parse the value - remove currency symbols and commas
          const sanitized = typeof value === 'string' 
                            ? value.replace(/[₹,]/g, '').trim()
                            : String(value);
          
          // Convert to number and add to total (handle NaN)
          const numericValue = parseFloat(sanitized);
          return total + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      };
      
      // Calculate payment amounts directly from all bookings (not relying on grouped data)
      const cashAmount = getCurrencyValueSum('Cash');
      const bankAmount = getCurrencyValueSum('UPI') + getCurrencyValueSum('Bank Transfer');
      const hudleAmount = getCurrencyValueSum('Hudle App') + 
                        getCurrencyValueSum('Hudle QR') + 
                        getCurrencyValueSum('Hudle Wallet') + 
                        getCurrencyValueSum('Venue Wallet') + 
                        getCurrencyValueSum('Hudle Pass') + 
                        getCurrencyValueSum('Hudle Discount');
      
      // Add payment stats
      stats.paymentStats = {
        cash: {
          count: data.filter(b => parseFloat(b['Cash'] || 0) > 0).length,
          amount: cashAmount
        },
        bank: {
          count: data.filter(b => (parseFloat(b['UPI'] || 0) + parseFloat(b['Bank Transfer'] || 0)) > 0).length,
          amount: bankAmount
        },
        hudle: {
          count: data.filter(b => {
            const hudleSum = parseFloat(b['Hudle App'] || 0) + 
                          parseFloat(b['Hudle QR'] || 0) + 
                          parseFloat(b['Hudle Wallet'] || 0) + 
                          parseFloat(b['Venue Wallet'] || 0) + 
                          parseFloat(b['Hudle Pass'] || 0) + 
                          parseFloat(b['Hudle Discount'] || 0);
            return hudleSum > 0;
          }).length,
          amount: hudleAmount
        }
      };
      
      // Verify the direct calculation matches the total
      const totalPayments = cashAmount + bankAmount + hudleAmount;
      const totalCollection = dataUtils.sum(data, 'Total Paid');
      
      // Log verification for debugging
      console.log('[StatsService] Payment calculation verification:');
      console.log(`  Total Collection: ${totalCollection}`);
      console.log(`  Cash Payment: ${cashAmount}`);
      console.log(`  Bank Payment: ${bankAmount}`);
      console.log(`  Hudle Payment: ${hudleAmount}`);
      console.log(`  Sum of Payment Modes: ${totalPayments}`);
      console.log(`  Difference: ${Math.abs(totalCollection - totalPayments)}`);
      
      // If there's still a significant difference, log a warning
      if (Math.abs(totalPayments - totalCollection) > 10) {
        console.warn(`[StatsService] WARNING: Payment calculation discrepancy (${totalPayments}) doesn't match total collection (${totalCollection})`);
      }
      
      // Calculate payment percentages
      if (totalPayments > 0) {
        stats.paymentStats.cash.percentage = (cashAmount / totalPayments) * 100;
        stats.paymentStats.bank.percentage = (bankAmount / totalPayments) * 100;
        stats.paymentStats.hudle.percentage = (hudleAmount / totalPayments) * 100;
      } else {
        stats.paymentStats.cash.percentage = 0;
        stats.paymentStats.bank.percentage = 0;
        stats.paymentStats.hudle.percentage = 0;
      }
      
      // Add monthly distribution
      stats.monthlyStats = Object.entries(byMonth).map(([month, bookings]) => ({
        month,
        bookings: bookings.length,
        revenue: dataUtils.sum(bookings, 'Total Paid'),
        slots: dataUtils.sum(bookings, 'Number of slots'),
        uniqueCustomers: new Set(bookings.map(b => b.Phone)).size
      }));
      
      // Add location distribution
      stats.locationStats = Object.entries(byLocation).map(([locationId, bookings]) => ({
        locationId,
        bookings: bookings.length,
        revenue: dataUtils.sum(bookings, 'Total Paid'),
        slots: dataUtils.sum(bookings, 'Number of slots'),
        uniqueCustomers: new Set(bookings.map(b => b.Phone)).size
      }));
      
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
   * Calculate statistics for a specific category using grouping service
   * @param {Array} data - Array of booking objects
   * @param {string} category - Category value
   * @param {Object} config - Category configuration
   * @returns {Object} Category statistics
   */
  calculateCategoryStats(data, category, config) {
    console.log(`[StatsService] Calculating stats for category: ${category}`);
    
    try {
      // Get the appropriate grouping function based on category type
      let groupingFunction;
      switch (config.category.toLowerCase()) {
        case 'location':
          groupingFunction = groupingService.groupByLocation;
          break;
        case 'month':
          groupingFunction = (data) => groupingService.groupByDate(data, 'month');
          break;
        case 'sport':
          groupingFunction = groupingService.groupBySport;
          break;
        case 'status':
          groupingFunction = groupingService.groupByStatus;
          break;
        case 'source':
          groupingFunction = groupingService.groupBySource;
          break;
        default:
          throw new Error(`Unknown category type: ${config.category}`);
      }
      
      // Group the data
      const groupedData = groupingFunction(data);
      const categoryData = groupedData[category] || [];
      
      // Calculate statistics for this category
      const stats = {
        totalBookings: categoryData.length,
        totalCollection: dataUtils.sum(categoryData, 'Total Paid'),
        totalSlots: dataUtils.sum(categoryData, 'Number of slots'),
        uniqueCustomers: new Set(categoryData.map(b => b.Phone)).size,
        totalBalance: dataUtils.sum(categoryData, 'Balance'),
        avgRevenuePerSlot: this.calculateAverage(categoryData, 'Total Paid', 'Number of slots'),
        completionRate: this.calculateCompletionRate(categoryData)
      };
      
      // Add payment mode distribution
      const paymentModes = groupingService.groupByPaymentMode(categoryData);
      
      // Helper function to safely parse currency values
      const getCurrencyValueSum = (fieldName) => {
        return categoryData.reduce((total, booking) => {
          // Get the value from the booking
          const value = booking[fieldName];
          
          // Skip undefined, null or empty values
          if (value === undefined || value === null || value === '') {
            return total;
          }
          
          // Parse the value - remove currency symbols and commas
          const sanitized = typeof value === 'string' 
                            ? value.replace(/[₹,]/g, '').trim()
                            : String(value);
          
          // Convert to number and add to total (handle NaN)
          const numericValue = parseFloat(sanitized);
          return total + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      };
      
      // Calculate payment amounts directly
      stats.paymentDistribution = {
        cash: getCurrencyValueSum('Cash'),
        bank: getCurrencyValueSum('UPI') + getCurrencyValueSum('Bank Transfer'),
        hudle: getCurrencyValueSum('Hudle App') + 
               getCurrencyValueSum('Hudle QR') + 
               getCurrencyValueSum('Hudle Wallet') + 
               getCurrencyValueSum('Venue Wallet') + 
               getCurrencyValueSum('Hudle Pass') + 
               getCurrencyValueSum('Hudle Discount')
      };
      
      // Add any extra stats defined in the config
      if (config.extraStats) {
        console.log('[StatsService] Processing extra stats for config:', config);
        config.extraStats.forEach(stat => {
          console.log(`[StatsService] Calculating ${stat.label}...`);
          const value = stat.calculate(categoryData);
          console.log(`[StatsService] ${stat.label} calculated:`, value);
          stats[stat.label] = value;
        });
      }
      
      console.log('[StatsService] Final stats:', stats);
      return stats;
    } catch (error) {
      console.error(`[StatsService] Error calculating category stats: ${error.message}`);
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
      'Hudle QR', 'Hudle Wallet', 'Venue Wallet',
      'Hudle Pass', 'Hudle Discount'
    ];
    
    // Helper function to safely parse currency values
    const getCurrencyValueSum = (fieldName) => {
      return data.reduce((sum, booking) => {
        const value = booking[fieldName];
        if (value === undefined || value === null || value === '') return sum;
        // Remove any currency symbols and commas, then parse
        const numericValue = parseFloat(String(value).replace(/[₹,]/g, '')) || 0;
        return sum + numericValue;
      }, 0);
    };
    
    const result = {};
    
    // Calculate individual payment methods
    paymentMethods.forEach(method => {
      result[method] = getCurrencyValueSum(method);
    });
    
    // Add aggregated payment types
    result.cashTotal = result.Cash || 0;
    result.bankTotal = (result.UPI || 0) + (result['Bank Transfer'] || 0);
    result.hudleTotal = (result['Hudle App'] || 0) + 
                       (result['Hudle QR'] || 0) + 
                       (result['Hudle Wallet'] || 0) + 
                       (result['Venue Wallet'] || 0) + 
                       (result['Hudle Pass'] || 0) + 
                       (result['Hudle Discount'] || 0);
    
    // Calculate total and percentages
    result.total = result.cashTotal + result.bankTotal + result.hudleTotal;
    
    if (result.total > 0) {
      result.cashPercentage = (result.cashTotal / result.total) * 100;
      result.bankPercentage = (result.bankTotal / result.total) * 100;
      result.hudlePercentage = (result.hudleTotal / result.total) * 100;
    }
    
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
      // Get bookings for this month
      const monthData = data.filter(booking => booking.Month === month);
      const year = monthData.length > 0 ? monthData[0].Year : '';
      
      // Skip if no data for this month
      if (monthData.length === 0) {
        return {
          month,
          year,
          cashAmount: 0,
          bankAmount: 0,
          hudleAmount: 0,
          totalAmount: 0,
          cashPercentage: 0,
          bankPercentage: 0,
          hudlePercentage: 0
        };
      }
      
      // Helper function to safely parse currency values
      const getCurrencyValueSum = (fieldName) => {
        return monthData.reduce((total, booking) => {
          // Get the value from the booking
          const value = booking[fieldName];
          
          // Skip undefined, null or empty values
          if (value === undefined || value === null || value === '') {
            return total;
          }
          
          // Parse the value - remove currency symbols and commas
          const sanitized = typeof value === 'string' 
                            ? value.replace(/[₹,]/g, '').trim()
                            : String(value);
          
          // Convert to number and add to total (handle NaN)
          const numericValue = parseFloat(sanitized);
          return total + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      };
      
      // Calculate payment amounts directly
      const cashAmount = getCurrencyValueSum('Cash');
      const bankAmount = getCurrencyValueSum('UPI') + getCurrencyValueSum('Bank Transfer');
      const hudleAmount = getCurrencyValueSum('Hudle App') + 
                        getCurrencyValueSum('Hudle QR') + 
                        getCurrencyValueSum('Hudle Wallet') + 
                        getCurrencyValueSum('Venue Wallet') + 
                        getCurrencyValueSum('Hudle Pass') + 
                        getCurrencyValueSum('Hudle Discount');
      
      const totalAmount = cashAmount + bankAmount + hudleAmount;
      
      // Verify the direct calculation matches the total paid for this month
      const totalPaid = dataUtils.sum(monthData, 'Total Paid');
      
      // Log verification for debugging (but only if there's data and a significant difference)
      if (monthData.length > 0 && Math.abs(totalAmount - totalPaid) > 10) {
        console.warn(`[StatsService] Month ${month} ${year} - Payment calculation discrepancy:`);
        console.warn(`  Total Paid: ${totalPaid}`);
        console.warn(`  Sum of Payment Modes: ${totalAmount}`);
        console.warn(`  Difference: ${Math.abs(totalPaid - totalAmount)}`);
      }
      
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
  },

  /**
   * Get statistics for a specific location
   * @param {string} locationId - Location ID
   * @returns {Object} Location-specific statistics
   */
  async getLocationStats(locationId) {
    try {
      console.log(`[StatsService] Fetching statistics for location: ${locationId}`);
      
      // Check if data is ready globally
      console.log('[StatsService] Checking if booking data is ready:', window.BOOKINGS_DATA_READY);
      
      // If data isn't ready yet, wait a moment and retry up to 3 times
      let attempts = 0;
      while (!window.BOOKINGS_DATA_READY && attempts < 3) {
        console.log(`[StatsService] Data not ready yet, waiting (attempt ${attempts + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        attempts++;
      }
      
      // Debug: Check what's in window.appData
      console.log('[StatsService] DEBUG - window.appData:', window.appData);
      console.log('[StatsService] DEBUG - global bookingsData length:', window.appData?.bookingsData?.length);
      
      const { bookingsData } = window.appData || {};
      if (!bookingsData || !bookingsData.length) {
        console.warn('[StatsService] No data available for location statistics');
        return null;
      }
      
      // Try to get locations data from imported JSON
      let locationName = null;
      let locations = [];
      
      try {
        // Dynamically import the locations data
        locations = await import('../locations.json').then(module => module.default);
        console.log(`[StatsService] Loaded ${locations.length} locations from locations.json`);
        
        // Find the location name using the provided ID
        const locationMatch = locations.find(loc => loc.Location_id === locationId);
        if (locationMatch) {
          locationName = locationMatch.Location_name;
          console.log(`[StatsService] Found location name: ${locationName} for ID: ${locationId}`);
        } else {
          console.warn(`[StatsService] Could not find location name for ID: ${locationId}`);
        }
      } catch (error) {
        console.error(`[StatsService] Error loading locations: ${error.message}`);
        // Continue anyway, we'll try matching directly
      }
      
      // Debug: Show a sample booking to check fields
      if (bookingsData.length > 0) {
        console.log('[StatsService] DEBUG - First booking record:', bookingsData[0]);
        console.log('[StatsService] DEBUG - Location field in first booking:', bookingsData[0].Location);
      }
      
      // Filter bookings for this location (try multiple matching strategies)
      const locationBookings = bookingsData.filter(booking => {
        // Strategy 1: Match by ID first if the booking has Location_id or LocationID
        const bookingLocationId = booking.Location_id || booking.LocationID;
        if (bookingLocationId && bookingLocationId === locationId) {
          return true;
        }
        
        // Strategy 2: Match by name if we have the location name
        if (locationName && booking.Location === locationName) {
          return true;
        }
        
        // Strategy 3: Direct match between location ID and Location field (fallback)
        if (booking.Location === locationId) {
          return true;
        }
        
        return false;
      });
      
      if (!locationBookings.length) {
        console.warn(`[StatsService] No bookings found for location ID: ${locationId} or name: ${locationName}`);
        
        // Last resort: Try to match any location with a name that contains part of the ID or vice versa
        if (locationName) {
          const fuzzyLocationBookings = bookingsData.filter(booking => {
            const locationField = booking.Location || '';
            return locationField.includes(locationName) || locationName.includes(locationField);
          });
          
          if (fuzzyLocationBookings.length > 0) {
            console.log(`[StatsService] Found ${fuzzyLocationBookings.length} bookings using fuzzy name matching for ${locationName}`);
            return this.processLocationBookings(fuzzyLocationBookings);
          }
        }
        
        return null;
      }
      
      console.log(`[StatsService] Processing ${locationBookings.length} bookings for location`);
      return this.processLocationBookings(locationBookings);
    } catch (error) {
      console.error(`[StatsService] Error getting location stats: ${error.message}`);
      throw new Error(`Failed to get location statistics: ${error.message}`);
    }
  },
  
  /**
   * Process filtered location bookings
   * @param {Array} locationBookings - Array of bookings for a single location
   * @returns {Object} Processed statistics
   */
  processLocationBookings(locationBookings) {
    // Calculate base statistics
    const totalCollection = dataUtils.sum(locationBookings, 'Total Paid');
    
    // Helper function to safely parse currency values
    const getCurrencyValueSum = (fieldName) => {
      return locationBookings.reduce((total, booking) => {
        const value = booking[fieldName];
        if (value === undefined || value === null || value === '') return total;
        const sanitized = typeof value === 'string' 
                        ? value.replace(/[₹,]/g, '').trim()
                        : String(value);
        const numericValue = parseFloat(sanitized);
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }, 0);
    };
    
    // Calculate payment amounts
    const cashAmount = getCurrencyValueSum('Cash');
    const bankAmount = getCurrencyValueSum('UPI') + getCurrencyValueSum('Bank Transfer');
    const hudleAmount = getCurrencyValueSum('Hudle App') + 
                      getCurrencyValueSum('Hudle QR') + 
                      getCurrencyValueSum('Hudle Wallet') + 
                      getCurrencyValueSum('Venue Wallet') + 
                      getCurrencyValueSum('Hudle Pass') + 
                      getCurrencyValueSum('Hudle Discount');
    
    const totalPayments = cashAmount + bankAmount + hudleAmount;
    
    // Time distribution
    const timeDistribution = this.calculateTimeDistribution(locationBookings);
    
    // Top customers
    const topCustomers = this.calculateTopCustomers(locationBookings, 'revenue', 3);
    
    // Format the stats object
    const stats = {
      totalBookings: locationBookings.length,
      totalCollection,
      totalOutstanding: dataUtils.sum(locationBookings, 'Balance'),
      uniqueCustomers: new Set(locationBookings.map(b => b.Phone)).size,
      totalSlots: dataUtils.sum(locationBookings, 'Number of slots'),
      avgBookingValue: locationBookings.length ? totalCollection / locationBookings.length : 0,
      avgSlotsPerBooking: locationBookings.length ? 
        dataUtils.sum(locationBookings, 'Number of slots') / locationBookings.length : 0,
      completionRate: this.calculateCompletionRate(locationBookings),
      onlineBookingPercentage: locationBookings.length ? 
        (locationBookings.filter(b => b.Source?.toLowerCase() === 'online').length / locationBookings.length) * 100 : 0,
      
      // Payment methods
      cashAmount,
      bankAmount,
      hudleAmount,
      cashPercentage: totalPayments > 0 ? (cashAmount / totalPayments) * 100 : 0,
      bankPercentage: totalPayments > 0 ? (bankAmount / totalPayments) * 100 : 0,
      hudlePercentage: totalPayments > 0 ? (hudleAmount / totalPayments) * 100 : 0,
      
      // Time distribution
      timeDistribution,
      
      // Top customers
      topCustomers
    };
    
    return stats;
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