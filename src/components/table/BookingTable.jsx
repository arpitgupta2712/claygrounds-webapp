import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { formatUtils } from '../../utils/formatUtils';
import EmptyState from '../common/EmptyState';

/**
 * Tooltip component for displaying hover information
 */
export function Tooltip({ content, children }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        {content}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </div>
  );
}

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired
};

/**
 * BookingTable component to display bookings in a tabular format
 * @param {Object} props - Component props
 * @param {Array} props.data - Booking data to display
 * @param {Function} props.onRowClick - Callback for row click events
 * @param {string} props.className - Additional CSS classes
 */
function BookingTable({ data, onRowClick, className = '' }) {
  const { CONSTANTS, sortField, sortDirection } = useApp();
  const { applySorting } = useBookings();
  const [hoveredRowId, setHoveredRowId] = useState(null);

  /**
   * Handle header click for sorting
   * @param {string} field - Field to sort by
   */
  const handleHeaderClick = useCallback((field) => {
    if (field && CONSTANTS.TABLE_HEADERS.find(h => h.key === field)?.sortable) {
      console.log(`[BookingTable] Sorting by: ${field}`);
      applySorting(field);
    }
  }, [applySorting, CONSTANTS.TABLE_HEADERS]);

  /**
   * Format cell content based on field type
   * @param {*} value - Cell value
   * @param {string} field - Field name
   * @returns {string|React.ReactNode} Formatted value
   */
  const formatCellContent = useCallback((value, field) => {
    if (value === undefined || value === null) return '';

    // Format based on field type
    if (field.includes('Price') || field.includes('Revenue') || 
        field.includes('Paid') || field.includes('Balance') || 
        field.includes('Discount')) {
      return formatUtils.currency(value);
    } 
    
    if (field === 'Slot Date') {
      // Pass 'default' explicitly to get DD/MM/YYYY format
      const formattedDate = formatUtils.formatDateForDisplay(value, 'default');
      const mediumFormat = formatUtils.formatDateForDisplay(value, 'medium');
      return (
        <Tooltip content={mediumFormat}>
          <span>{formattedDate}</span>
        </Tooltip>
      );
    }
    
    if (field === 'Status') {
      // Apply status-specific styling via a wrapper
      let statusClass = 'text-gray-500';
      if (value === 'Confirmed') statusClass = 'text-success';
      if (value === 'Pending') statusClass = 'text-yellow-600';
      if (value === 'Cancelled') statusClass = 'text-error';
      
      return (
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}>
          {value}
        </span>
      );
    }
    
    // Default formatting
    return String(value);
  }, []);

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState 
        title="No bookings found" 
        message="There are no bookings to display based on your current criteria." 
      />
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="table-container min-w-full shadow-sm rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-background-light">
            <tr>
              {CONSTANTS.TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={`px-5 py-4 text-center text-sm font-semibold text-text-dark uppercase tracking-wider whitespace-nowrap
                             ${header.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                             ${sortField === header.key ? 'bg-primary-transparent border-b-2 border-primary' : ''}`}
                  onClick={() => header.sortable && handleHeaderClick(header.key)}
                  data-field={header.key}
                >
                  <div className="flex items-center justify-center">
                    {header.label}
                    
                    {header.sortable && (
                      <span className="ml-2">
                        {sortField === header.key ? (
                          sortDirection === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((booking, index) => (
              <tr
                key={`${booking['Booking Reference']}-${index}`}
                className={`
                  ${index % 2 === 0 ? 'bg-white' : 'bg-background-light'} 
                  ${hoveredRowId === index ? 'bg-gray-50' : ''}
                  cursor-pointer transition-colors
                `}
                onClick={() => onRowClick?.(booking)}
                onMouseEnter={() => setHoveredRowId(index)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {CONSTANTS.TABLE_HEADERS.map((header) => (
                  <td 
                    key={`${booking['Booking Reference']}-${index}-${header.key}`}
                    className="px-5 py-4 text-center whitespace-nowrap"
                  >
                    {formatCellContent(booking[header.key], header.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

BookingTable.propTypes = {
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  className: PropTypes.string
};

export default BookingTable;