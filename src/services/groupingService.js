import { parseDate } from '../utils/dateUtils';
import { formatUtils } from '../utils/formatUtils';

/**
 * Service for grouping booking data by various parameters
 */
export const groupingService = {
  /**
   * Group bookings by date parameters (day/month/year)
   * @param {Array} bookings - Array of booking objects
   * @param {string} groupBy - 'day' | 'month' | 'year'
   * @returns {Object} Grouped bookings
   */
  groupByDate(bookings, groupBy = 'day') {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      const slotDate = booking['Slot Date'];
      if (!slotDate) return groups;

      const date = parseDate(slotDate);
      if (!date) return groups;

      let key;
      switch (groupBy) {
        case 'day':
          key = formatUtils.formatDate(date);
          break;
        case 'month':
          // Use financial year months (April-March)
          const month = date.getMonth();
          const year = date.getFullYear();
          // If month is January-March, it belongs to previous year's financial year
          const financialYear = month < 3 ? year - 1 : year;
          key = `${date.toLocaleString('default', { month: 'long' })} ${financialYear}`;
          break;
        case 'year':
          // Financial year format (e.g., "2024-25")
          const fy = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
          key = `${fy}-${(fy + 1).toString().slice(-2)}`;
          break;
        default:
          key = formatUtils.formatDate(date);
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(booking);
      return groups;
    }, {});
  },

  /**
   * Group bookings by location
   * @param {Array} bookings - Array of booking objects
   * @returns {Object} Bookings grouped by location
   */
  groupByLocation(bookings) {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      // Use Location field as the primary key
      const location = booking.Location;
      if (!location) {
        console.warn('[GroupingService] Booking has no location:', booking);
        return groups;
      }

      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(booking);
      return groups;
    }, {});
  },

  /**
   * Group bookings by source (Online/Offline)
   * @param {Array} bookings - Array of booking objects
   * @returns {Object} Bookings grouped by source
   */
  groupBySource(bookings) {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      const source = booking.Source?.toLowerCase() || 'unknown';
      const key = source === 'online' ? 'online' : 'offline';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(booking);
      return groups;
    }, {});
  },

  /**
   * Group bookings by sport
   * @param {Array} bookings - Array of booking objects
   * @returns {Object} Bookings grouped by sport
   */
  groupBySport(bookings) {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      const sport = booking.Sport || 'Unknown';

      if (!groups[sport]) {
        groups[sport] = [];
      }
      groups[sport].push(booking);
      return groups;
    }, {});
  },

  /**
   * Group bookings by status
   * @param {Array} bookings - Array of booking objects
   * @returns {Object} Bookings grouped by status
   */
  groupByStatus(bookings) {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      const status = booking.Status?.toLowerCase() || 'unknown';
      
      // Normalize status values
      let normalizedStatus;
      if (status.includes('confirm')) normalizedStatus = 'confirmed';
      else if (status.includes('cancel')) {
        normalizedStatus = status.includes('partial') ? 'partially_cancelled' : 'cancelled';
      } else normalizedStatus = 'unknown';

      if (!groups[normalizedStatus]) {
        groups[normalizedStatus] = [];
      }
      groups[normalizedStatus].push(booking);
      return groups;
    }, {});
  },

  /**
   * Group bookings by payment mode
   * @param {Array} bookings - Array of booking objects
   * @returns {Object} Bookings grouped by payment mode
   */
  groupByPaymentMode(bookings) {
    if (!bookings?.length) return {};

    return bookings.reduce((groups, booking) => {
      // Make sure values are properly parsed as numbers
      const getCurrencyValue = (field) => {
        const value = booking[field];
        if (value === undefined || value === null || value === '') return 0;
        // Remove any currency symbols and commas, then parse
        const numericValue = parseFloat(String(value).replace(/[₹,]/g, '')) || 0;
        return numericValue;
      };

      // Initialize payment modes
      const cashAmount = getCurrencyValue('Cash');
      const bankAmount = getCurrencyValue('UPI') + getCurrencyValue('Bank Transfer');
      const hudleAmount = getCurrencyValue('Hudle App') + 
                         getCurrencyValue('Hudle QR') + 
                         getCurrencyValue('Hudle Wallet') + 
                         getCurrencyValue('Venue Wallet') + 
                         getCurrencyValue('Hudle Pass') + 
                         getCurrencyValue('Hudle Discount');

      // Add booking to cash group if there's a cash payment
      if (cashAmount > 0) {
        if (!groups.cash) groups.cash = [];
        groups.cash.push({
          ...booking,
          payment_amount: cashAmount
        });
      }

      // Add booking to bank group if there's a bank payment
      if (bankAmount > 0) {
        if (!groups.bank) groups.bank = [];
        groups.bank.push({
          ...booking,
          payment_amount: bankAmount
        });
      }

      // Add booking to hudle group if there's a hudle payment
      if (hudleAmount > 0) {
        if (!groups.hudle) groups.hudle = [];
        groups.hudle.push({
          ...booking,
          payment_amount: hudleAmount
        });
      }

      return groups;
    }, {});
  },

  /**
   * Get statistics for grouped bookings
   * @param {Object} groupedBookings - Object containing grouped bookings
   * @returns {Object} Statistics for each group
   */
  getGroupStats(groupedBookings) {
    const stats = {};

    Object.entries(groupedBookings).forEach(([key, bookings]) => {
      stats[key] = {
        count: bookings.length,
        totalAmount: bookings.reduce((sum, b) => sum + (parseFloat(b['Total Paid'] || 0)), 0),
        totalSlots: bookings.reduce((sum, b) => sum + (parseInt(b['Number of slots'] || 0)), 0),
        uniqueCustomers: new Set(bookings.map(b => b.Phone)).size,
        avgBookingValue: 0
      };

      // Calculate average booking value
      if (stats[key].count > 0) {
        stats[key].avgBookingValue = stats[key].totalAmount / stats[key].count;
      }
    });

    return stats;
  }
}; 