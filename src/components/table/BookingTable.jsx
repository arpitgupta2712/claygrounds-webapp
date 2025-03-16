import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { formatUtils } from '../../utils/formatUtils';
import EmptyState from '../common/EmptyState';
import Tooltip from '../common/Tooltip';
import { withErrorBoundary } from '../common/ErrorBoundary';

function TableFallback({ error }) {
  return (
    <div className="p-4 bg-error-light border border-error rounded-md">
      <div className="flex items-center space-x-3 mb-3">
        <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-error">Table Error</h3>
      </div>
      <p className="text-gray-600 mb-3">{error?.message || 'Error loading table data'}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1 bg-white border border-error text-error rounded hover:bg-error hover:text-white transition-colors"
      >
        Reload Table
      </button>
    </div>
  );
}

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
  const { handleError, handleAsync } = useErrorHandler();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [isSorting, setIsSorting] = useState(false);

  /**
   * Handle header click for sorting
   * @param {string} field - Field to sort by
   */
  const handleHeaderClick = useCallback(async (field) => {
    if (!field || !CONSTANTS.TABLE_HEADERS.find(h => h.key === field)?.sortable) {
      return;
    }

    setIsSorting(true);
    
    try {
      const result = await handleAsync(
        async () => {
          console.log(`[BookingTable] Sorting by: ${field}`);
          await applySorting(field);
        },
        'BookingTable.handleHeaderClick',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.UI,
          metadata: {
            field,
            currentSort: sortField,
            direction: sortDirection
          }
        }
      );

      if (result?.error) {
        // If handleAsync returned an error object, handle it appropriately
        handleError(
          result.error,
          'BookingTable.handleHeaderClick',
          ErrorSeverity.ERROR,
          ErrorCategory.UI,
          { field, currentSort: sortField }
        );
      }
    } finally {
      setIsSorting(false);
    }
  }, [applySorting, CONSTANTS.TABLE_HEADERS, handleAsync, handleError, sortField, sortDirection]);

  /**
   * Format cell content based on field type
   * @param {*} value - Cell value
   * @param {string} field - Field name
   * @returns {string|React.ReactNode} Formatted value
   */
  const formatCellContent = useCallback((value, field) => {
    if (value === undefined || value === null) return '';

    return handleAsync(
      () => {
        // Format based on field type
        switch (field) {
          case 'date':
            return formatUtils.formatDate(value);
          case 'time':
            return formatUtils.formatTime(value);
          case 'amount':
            return formatUtils.formatCurrency(value);
          case 'status':
            return (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getStatusColor(value)}`}>
                {value}
              </span>
            );
          default:
            return String(value);
        }
      },
      'BookingTable.formatCellContent',
      {
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.UI,
        metadata: { field, valueType: typeof value },
        rethrow: false
      }
    ) || String(value); // Fallback to string if formatting fails
  }, [handleAsync]);

  /**
   * Handle row click with error handling
   * @param {Object} booking - The booking data for the clicked row
   */
  const handleRowClick = useCallback(async (booking) => {
    if (!onRowClick) return;

    await handleAsync(
      async () => {
        await onRowClick(booking);
      },
      'BookingTable.handleRowClick',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          bookingId: booking['Booking Reference'],
          bookingDate: booking['Slot Date']
        }
      }
    );
  }, [onRowClick, handleAsync]);

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
          <thead className={`bg-background-light ${isSorting ? 'opacity-75' : ''}`}>
            <tr>
              {CONSTANTS.TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={`px-5 py-4 text-center text-sm font-semibold text-text-dark uppercase tracking-wider whitespace-nowrap
                             ${header.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                             ${sortField === header.key ? 'bg-primary-transparent border-b-2 border-primary' : ''}`}
                  onClick={() => header.sortable && !isSorting && handleHeaderClick(header.key)}
                  data-field={header.key}
                >
                  <div className="flex items-center justify-center">
                    {header.label}
                    
                    {header.sortable && (
                      <span className="ml-2">
                        {sortField === header.key ? (
                          sortDirection === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSorting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSorting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                onClick={() => handleRowClick(booking)}
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

// Wrap BookingTable with error boundary
export default withErrorBoundary(
  memo(BookingTable),
  {
    fallback: TableFallback,
    context: 'BookingTable',
    metadata: {
      feature: 'bookings-table',
      importance: 'high'
    }
  }
);