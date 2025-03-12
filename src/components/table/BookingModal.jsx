import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';

/**
 * Modal component for displaying booking details
 * @param {Object} props - Component props
 * @param {Object} props.booking - Booking data to display
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to call when modal closes
 */
function BookingModal({ booking, isOpen, onClose }) {
  const modalRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no booking data
  if (!isOpen || !booking) {
    return null;
  }

  /**
   * Create a detail row
   * @param {string} label - Row label
   * @param {*} value - Row value
   * @param {Function} formatFn - Function to format value
   * @param {boolean} isCurrency - Whether value is currency
   * @param {boolean} highlight - Whether to highlight row
   * @returns {JSX.Element} Detail row component
   */
  const DetailRow = ({ label, value, formatFn, isCurrency = false, highlight = false }) => {
    if (value === undefined || value === null || value === '') return null;

    const formattedValue = formatFn ? formatFn(value) : value;

    return (
      <div className={`flex py-[0.85rem] px-3 border-b border-gray-100 last:border-0 ${highlight ? 'bg-gray-50' : ''}`}>
        <div className="w-2/5 font-medium text-text-medium">{label}</div>
        <div className={`w-3/5 ${isCurrency ? 'font-mono font-medium' : ''}`}>
          {isCurrency ? (
            <span className="inline-block px-3 py-1 font-medium">{formattedValue}</span>
          ) : (
            formattedValue
          )}
        </div>
      </div>
    );
  };

  DetailRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    formatFn: PropTypes.func,
    isCurrency: PropTypes.bool,
    highlight: PropTypes.bool
  };

  // Group fields by category for better organization
  const fieldGroups = {
    'Basic Information': [
      { key: 'Location', label: 'Location' },
      { key: 'Source', label: 'Booking Source' },
      { key: 'Status', label: 'Status' },
      { key: 'Booking Reference', label: 'Reference Number' }
    ],
    'Customer Information': [
      { key: 'Customer ID', label: 'Customer ID' },
      { key: 'Customer Name', label: 'Customer' },
      { key: 'Phone', label: 'Phone Number' }
    ],
    'Slot Details': [
      { key: 'Facility', label: 'Facility' },
      { key: 'Sport', label: 'Sport' },
      { key: 'Slot Date', label: 'Slot Date' },
      { key: 'Slot Time', label: 'Start Time' },
      { key: 'Slot Details', label: 'Slot Details' },
      { key: 'Number of slots', label: 'Number of Slots' }
    ],
    'Financial Information': [
      { key: 'Slot Price', label: 'Price per Slot', format: formatUtils.currency, isCurrency: true },
      { key: 'Revenue', label: 'Gross Revenue', format: formatUtils.currency, isCurrency: true },
      { key: 'Venue Discount', label: 'Discount', format: formatUtils.currency, isCurrency: true }
    ],
    'Payment Details': [
      { key: 'Cash', label: 'Cash', format: formatUtils.currency, isCurrency: true },
      { key: 'UPI', label: 'UPI', format: formatUtils.currency, isCurrency: true },
      { key: 'Bank Transfer', label: 'Bank Transfer', format: formatUtils.currency, isCurrency: true },
      { key: 'Hudle App', label: 'Hudle App', format: formatUtils.currency, isCurrency: true },
      { key: 'Hudle QR', label: 'Hudle QR', format: formatUtils.currency, isCurrency: true },
      { key: 'Hudle Wallet', label: 'Hudle Wallet', format: formatUtils.currency, isCurrency: true },
      { key: 'Venue Wallet', label: 'Venue Wallet', format: formatUtils.currency, isCurrency: true },
      { key: 'Hudle Pass', label: 'Hudle Pass', format: formatUtils.currency, isCurrency: true },
      { key: 'Hudle Discount', label: 'Hudle Discount', format: formatUtils.currency, isCurrency: true }
    ],
    'Payment Summary': [
      { key: 'Total Paid', label: 'Total Paid', format: formatUtils.currency, isCurrency: true, highlight: true },
      { key: 'Balance', label: 'Balance', format: formatUtils.currency, isCurrency: true, highlight: true }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden animate-fadeUp"
      >
        {/* Close button */}
        <button
          className="absolute right-6 top-6 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white bg-transparent hover:bg-primary rounded-full transition-all hover:rotate-90"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="text-2xl font-semibold">&times;</span>
        </button>

        {/* Modal content */}
        <div className="overflow-y-auto max-h-[90vh] p-10">
          {/* Header with booking reference */}
          <div className="mb-7 pb-4 border-b-2 border-primary">
            <h2 className="text-2xl font-semibold text-primary mb-2">Booking Details</h2>
            <p className="text-text-light text-sm">
              Reference: {booking['Booking Reference'] || 'N/A'}
            </p>
          </div>

          {/* Details sections */}
          {Object.entries(fieldGroups).map(([groupName, fields]) => {
            // Check if any field in this group has a value
            const hasValues = fields.some(field => 
              booking[field.key] != null && booking[field.key] !== ''
            );
            
            if (!hasValues) return null;
            
            return (
              <div key={groupName} className="mb-7 bg-gray-50 rounded-lg border-l-3 border-primary p-4">
                <h3 className="text-lg font-semibold text-primary mb-4 pb-2 border-b border-primary-light border-opacity-20">
                  {groupName}
                </h3>
                
                {fields.map(field => 
                  booking[field.key] != null && booking[field.key] !== '' ? (
                    <DetailRow
                      key={field.key}
                      label={field.label}
                      value={booking[field.key]}
                      formatFn={field.format}
                      isCurrency={field.isCurrency}
                      highlight={field.highlight}
                    />
                  ) : null
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

BookingModal.propTypes = {
  booking: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default BookingModal;