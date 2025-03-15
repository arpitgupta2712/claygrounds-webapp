import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';
import BaseModal from '../common/BaseModal';

/**
 * Modal component for displaying booking details
 * @param {Object} props - Component props
 * @param {Object} props.booking - Booking data to display
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to call when modal closes
 */
const BookingModal = React.memo(function BookingModal({ booking, onClose }) {
  const formatValue = useCallback((value, type = 'text') => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (type) {
      case 'currency':
        return formatUtils.currency(value);
      case 'date':
        return formatUtils.date(value);
      case 'percentage':
        return formatUtils.percentage(value);
      default:
        return value.toString();
    }
  }, []);

  // Memoize booking details
  const bookingDetails = useMemo(() => [
    { label: 'Booking ID', value: booking.id },
    { label: 'Customer Name', value: booking.customerName },
    { label: 'Booking Date', value: booking.bookingDate, type: 'date' },
    { label: 'Total Amount', value: booking.totalAmount, type: 'currency' },
    { label: 'Balance', value: booking.balance, type: 'currency' },
    { label: 'Status', value: booking.status },
    { label: 'Location', value: booking.location },
    { label: 'Category', value: booking.category }
  ], [booking]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Booking Details"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookingDetails.map(({ label, value, type }) => (
          <div 
            key={label}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">
              {formatValue(value, type)}
            </div>
          </div>
        ))}
      </div>

      {/* Additional booking-specific content */}
      {booking.notes && (
        <div className="mt-6">
          <div className="text-sm text-gray-500">Notes</div>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            {booking.notes}
          </div>
        </div>
      )}
    </BaseModal>
  );
});

BookingModal.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.string.isRequired,
    customerName: PropTypes.string.isRequired,
    bookingDate: PropTypes.string.isRequired,
    totalAmount: PropTypes.number.isRequired,
    balance: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    notes: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default BookingModal;