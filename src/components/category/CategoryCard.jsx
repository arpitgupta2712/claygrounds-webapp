import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';
import { Tooltip } from '../table/BookingTable';

/**
 * CategoryCard component displays category information with key statistics
 * @param {Object} props - Component props
 * @param {string} props.category - Category name
 * @param {Object} props.stats - Category statistics
 * @param {Function} props.onSelect - Callback for when card is selected
 */
function CategoryCard({ category, stats, onSelect }) {
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(category);
    }
  }, [category, onSelect]);

  return (
    <div 
      className="bg-white p-7 rounded-md shadow transition-all duration-300 border border-gray-100 
                 hover:shadow-md hover:border-primary-light hover:bg-primary hover:text-white
                 cursor-pointer relative overflow-hidden transform hover:-translate-y-1 h-full flex flex-col"
      onClick={handleClick}
      data-category={category}
    >
      {/* Category title */}
      <h3 className="text-2xl font-semibold mb-4 text-text-dark group-hover:text-white transition-colors">
        {category}
      </h3>
      
      {/* Statistics rows */}
      <div className="space-y-3 flex-grow">
        {stats && stats.totalBookings !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Bookings</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.number(stats.totalBookings)}
            </span>
          </div>
        )}
        
        {stats && stats.totalCollection !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Collection</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.currency(stats.totalCollection)}
            </span>
          </div>
        )}

        {stats && stats.totalBalance !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Outstanding</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.currency(stats.totalBalance)}
            </span>
          </div>
        )}
        
        {stats && stats.uniqueCustomers !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Unique Customers</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.number(stats.uniqueCustomers)}
            </span>
          </div>
        )}
        
        {/* Display any custom statistics if available */}
        {stats && Object.entries(stats)
          .filter(([key]) => !['totalBookings', 'totalCollection', 'totalBalance', 'uniqueCustomers'].includes(key))
          .map(([key, value]) => {
            // Handle Top Customer object with phone number
            if (key === 'Top Customer' && typeof value === 'object' && value !== null) {
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-text-medium">{key}</span>
                  <Tooltip content={`Phone: ${value.phone}`}>
                    <span className="font-semibold text-text-dark cursor-help">
                      {value.displayText}
                    </span>
                  </Tooltip>
                </div>
              );
            }
            
            // Normal case for other stats
            return (
              <div key={key} className="flex justify-between">
                <span className="text-text-medium">{key}</span>
                <span className="font-semibold text-text-dark">
                  {typeof value === 'number' ? formatUtils.number(value) : value}
                </span>
              </div>
            );
          })
        }
      </div>
      
      {/* Hover effect for "View Details" */}
      <div className="absolute bottom-0 right-0 p-3 opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-sm font-medium">View Details →</span>
      </div>
    </div>
  );
}

CategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  stats: PropTypes.object,
  onSelect: PropTypes.func.isRequired
};

export default CategoryCard;