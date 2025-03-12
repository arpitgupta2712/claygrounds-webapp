/**
 * View type definitions
 * @enum {string}
 */
export const ViewTypes = {
    TABLE: 'table',
    CATEGORY: 'category',
    LOCATIONS: 'locations',
    MONTHS: 'months',
    SPORTS: 'sports',
    STATUS: 'status',
    SOURCE: 'source',
    PAYMENTS: 'payments'
};
  
/**
 * Filter type definitions
 * @enum {string}
 */
export const FilterTypes = {
  SINGLE_DATE: 'single-date',
  DATE_RANGE: 'date-range',
  LOCATION: 'location',
  CUSTOMER: 'customer',
  BOOKING_REF: 'booking-ref',
  PHONE: 'phone',
  BALANCE: 'balance'
};
  
/**
 * Application-wide constants
 */
export const CONSTANTS = {
  DATE_FORMAT: 'DD/MM/YYYY',
  CURRENCY_LOCALE: 'en-IN',
  CURRENCY_SYMBOL: '₹',
  MIN_SEARCH_LENGTH: 2,
  DEFAULT_PAGE_SIZE: 100,
  API_ENDPOINTS: {
    BOOKINGS: 'data/{year}/bookings.csv'
  },
  TABLE_HEADERS: [
    { key: 'S no', label: 'S No', sortable: true },
    { key: 'Slot Date', label: 'Date', sortable: true },
    { key: 'Customer Name', label: 'Customer', sortable: true },
    { key: 'Phone', label: 'Phone No', sortable: true },
    { key: 'Location', label: 'Location', sortable: true },
    { key: 'Booking Reference', label: 'Hudle Reference', sortable: true },
    { key: 'Status', label: 'Status', sortable: true },
    { key: 'Venue Discount', label: 'Discount', sortable: true },
    { key: 'Total Paid', label: 'Paid', sortable: true },
    { key: 'Balance', label: 'Balance', sortable: true }
  ]
};
  
/**
 * Filter configuration
 */
export const FilterConfig = {
  [FilterTypes.SINGLE_DATE]: {
    type: 'date',
    field: 'Slot Date',
    label: 'Single Date'
  },
  [FilterTypes.DATE_RANGE]: {
    type: 'dateRange',
    field: 'Slot Date',
    label: 'Date Range'
  },
  [FilterTypes.LOCATION]: {
    type: 'select',
    field: 'Location',
    label: 'Location'
  },
  [FilterTypes.CUSTOMER]: {
    type: 'text',
    field: 'Customer Name',
    label: 'Customer Name'
  },
  [FilterTypes.BOOKING_REF]: {
    type: 'text',
    field: 'Booking Reference',
    label: 'Booking Reference'
  },
  [FilterTypes.PHONE]: {
    type: 'number',
    field: 'Phone',
    label: 'Phone Number'
  },
  [FilterTypes.BALANCE]: {
    type: 'checkbox',
    field: 'Balance',
    label: 'Outstanding Balance'
  }
};
  
/**
 * Category view configuration
 */
export const categoryConfigs = {
  months: {
    category: 'Month',
    valueField: 'Month',
    displayNameField: 'Month',
    sortOrder: ['April', 'May', 'June', 'July', 'August', 'September', 
               'October', 'November', 'December', 'January', 'February', 'March'],
    extraStats: [
      { 
        label: 'Average Daily Bookings',
        calculate: (bookings) => Math.round(bookings.length / 30)
      },
      {
        label: 'Online Bookings',
        calculate: (bookings) => {
          const total = bookings.length;
          if (total === 0) return '0%';
          const online = bookings.filter(b => b.Source === 'Online').length;
          return `${Math.round((online / total) * 100)}%`;
        }
      },
      {
        label: 'Best Selling Date',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const dateCollections = {};
          bookings.forEach(b => {
            const date = b['Slot Date'].split(' ')[0]; // Get just the date part
            dateCollections[date] = (dateCollections[date] || 0) + (Number(b['Total Paid']) || 0);
          });
          const bestDate = Object.entries(dateCollections)
            .sort(([,a], [,b]) => b - a)[0];
          return bestDate ? bestDate[0] : 'N/A';
        }
      },
      {
        label: 'Top Weekday',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const dayCollections = {
            'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
            'Thursday': 0, 'Friday': 0
          };
          bookings.forEach(b => {
            // Parse the date string correctly
            const [datePart] = b['Slot Date'].split(' ');
            const [day, month, year] = datePart.split('/');
            // Create date in MM/DD/YYYY format for proper parsing
            const date = new Date(`${month}/${day}/${year}`);
            if (!isNaN(date)) {
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              // Only include weekdays (Monday through Friday)
              if (dayCollections.hasOwnProperty(dayName)) {
                dayCollections[dayName] = (dayCollections[dayName] || 0) + (Number(b['Total Paid']) || 0);
              }
            }
          });
          const bestDay = Object.entries(dayCollections)
            .sort(([,a], [,b]) => b - a)[0];
          return bestDay ? bestDay[0] : 'N/A';
        }
      }
    ]
  },
  locations: {
    category: 'Location',
    valueField: 'Location',
    displayNameField: 'Location',
    extraStats: [
      {
        label: 'Online Bookings',
        calculate: (bookings) => {
          const total = bookings.length;
          if (total === 0) return '0%';
          const online = bookings.filter(b => b.Source === 'Online').length;
          return `${Math.round((online / total) * 100)}%`;
        }
      },
      {
        label: 'Popular Sport',
        calculate: (bookings) => {
          const sportCounts = {};
          bookings.forEach(b => {
            sportCounts[b.Sport] = (sportCounts[b.Sport] || 0) + 1;
          });
          const popularSport = Object.entries(sportCounts)
            .sort(([,a], [,b]) => b - a)[0];
          return popularSport ? popularSport[0] : 'N/A';
        }
      }
    ]
  },
  sports: {
    category: 'Sport',
    valueField: 'Sport',
    displayNameField: 'Sport',
    extraStats: [
      {
        label: 'Top Location',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const locationCollections = {};
          bookings.forEach(b => {
            locationCollections[b.Location] = (locationCollections[b.Location] || 0) + (Number(b['Total Paid']) || 0);
          });
          const bestLocation = Object.entries(locationCollections)
            .sort(([,a], [,b]) => b - a)[0];
          return bestLocation ? bestLocation[0] : 'N/A';
        }
      },
      {
        label: 'Online Bookings',
        calculate: (bookings) => {
          const total = bookings.length;
          if (total === 0) return '0%';
          const online = bookings.filter(b => b.Source === 'Online').length;
          return `${Math.round((online / total) * 100)}%`;
        }
      },
      {
        label: 'Avg Collection/Slot',
        calculate: (bookings) => {
          const totalSlots = bookings.reduce((sum, b) => sum + (Number(b["Number of slots"]) || 0), 0);
          const totalCollection = bookings.reduce((sum, b) => sum + (Number(b['Total Paid']) || 0), 0);
          if (!totalSlots) return '₹0';
          // Calculate average and round to nearest 50
          const avg = totalCollection / totalSlots;
          const roundedAvg = Math.round(avg / 50) * 50;
          return `₹${roundedAvg.toLocaleString('en-IN')}`;
        }
      },
      {
        label: 'Avg Slots/Booking',
        calculate: (bookings) => {
          if (!bookings.length) return '0';
          const totalSlots = bookings.reduce((sum, b) => sum + (Number(b["Number of slots"]) || 0), 0);
          return Math.round(totalSlots / bookings.length).toString();
        }
      }
    ]
  },
  status: {
    category: 'Status',
    valueField: 'Status',
    displayNameField: 'Status',
    extraStats: [
      {
        label: 'Top Location',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const locationCounts = {};
          bookings.forEach(b => {
            locationCounts[b.Location] = (locationCounts[b.Location] || 0) + 1;
          });
          const topLocation = Object.entries(locationCounts)
            .sort(([,a], [,b]) => b - a)[0];
          return topLocation ? topLocation[0] : 'N/A';
        }
      },
      {
        label: 'Top Customer',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const customerData = {};
          bookings.forEach(b => {
            const phone = b['Phone'];
            const customerName = b['Customer Name'];
            
            if (!phone) return;
            
            // Normalize phone number
            const normalizedPhone = String(phone).replace(/\D/g, '');
            
            if (!customerData[normalizedPhone]) {
              customerData[normalizedPhone] = {
                count: 0,
                name: customerName,
                phone: phone
              };
            }
            
            customerData[normalizedPhone].count += 1;
          });
          
          const sortedCustomers = Object.entries(customerData)
            .sort(([, a], [, b]) => b.count - a.count);
            
          const topCustomer = sortedCustomers[0];
          
          if (!topCustomer) return 'N/A';
          
          return {
            name: topCustomer[1].name,
            phone: topCustomer[1].phone,
            displayText: topCustomer[1].name
          };
        }
      }
    ]
  },
  source: {
    category: 'Source',
    valueField: 'Source',
    displayNameField: 'Source',
    extraStats: [
      {
        label: 'Top Location',
        calculate: (bookings) => {
          if (bookings.length === 0) return 'N/A';
          const locationCounts = {};
          bookings.forEach(b => {
            locationCounts[b.Location] = (locationCounts[b.Location] || 0) + 1;
          });
          const topLocation = Object.entries(locationCounts)
            .sort(([,a], [,b]) => b - a)[0];
          return topLocation ? topLocation[0] : 'N/A';
        }
      },
      {
        label: 'Cancellation Rate',
        calculate: (bookings) => {
          if (bookings.length === 0) return '0.0%';
          const cancelled = bookings.filter(b => b.Status === 'Cancelled').length;
          return `${((cancelled / bookings.length) * 100).toFixed(1)}%`;
        }
      }
    ]
  }
};