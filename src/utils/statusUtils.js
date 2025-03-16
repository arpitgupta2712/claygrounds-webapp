/**
 * Get the appropriate color class based on booking status
 * @param {string} status - The booking status
 * @returns {string} Tailwind CSS classes for the status color
 */
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-success-light text-success';
    case 'pending':
      return 'bg-warning-light text-warning';
    case 'cancelled':
      return 'bg-error-light text-error';
    case 'completed':
      return 'bg-info-light text-info';
    case 'no show':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
} 