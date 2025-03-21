import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';
import Tooltip from '../common/Tooltip';

/**
 * CategoryCard component displays category information with key statistics
 * @param {Object} props - Component props
 * @param {string} props.title - Category title
 * @param {Object} props.stats - Category statistics
 * @param {Object} props.config - Category configuration
 * @param {Function} props.onClick - Click handler for the card
 */
const CategoryCard = React.memo(function CategoryCard({ title, stats, config, onClick }) {
  // Remove console.log to reduce memory usage
  if (!stats) {
    return null;
  }

  // Memoize the formatStatValue function
  const formatStatValue = useCallback((value) => {
    if (value === undefined || value === null) return 'N/A';
    
    // If value is an object with displayText, use that
    if (typeof value === 'object' && value !== null && 'displayText' in value) {
      return (
        <Tooltip content={`Phone: ${value.phone}`}>
          <span className="cursor-help">{value.displayText}</span>
        </Tooltip>
      );
    }
    
    // Handle numeric values
    if (typeof value === 'number') {
      return formatUtils.number(value);
    }
    
    // Return as is for strings
    return value;
  }, []);

  // Memoize extra stats calculations
  const extraStats = useMemo(() => {
    if (!config?.extraStats) return [];
    return config.extraStats.map(extraStat => {
      const value = stats[extraStat.label];
      if (value === undefined) return null;
      
      return (
        <div key={extraStat.label} className="flex justify-between">
          <span className="text-text-medium">{extraStat.label}</span>
          <span className="font-semibold text-text-dark">
            {formatStatValue(value)}
          </span>
        </div>
      );
    }).filter(Boolean);
  }, [config?.extraStats, stats, formatStatValue]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(title, stats);
    }
  }, [onClick, title, stats]);

  return (
    <div 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className="bg-white p-7 rounded-md shadow transition-all duration-300 border border-gray-100 
                 hover:shadow-md hover:border-primary-light hover:bg-primary hover:text-white
                 cursor-pointer relative overflow-hidden transform hover:-translate-y-1 h-full flex flex-col"
    >
      {/* Category title */}
      <h3 className="text-2xl font-semibold mb-4 text-text-dark group-hover:text-white transition-colors">
        {title}
      </h3>
      
      {/* Statistics rows */}
      <div className="space-y-3 flex-grow">
        {stats.totalBookings !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Bookings</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.number(stats.totalBookings)}
            </span>
          </div>
        )}
        
        {stats.totalCollection !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Collection</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.currency(stats.totalCollection)}
            </span>
          </div>
        )}

        {stats.totalBalance !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Total Outstanding</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.currency(stats.totalBalance)}
            </span>
          </div>
        )}
        
        {stats.uniqueCustomers !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-medium">Unique Customers</span>
            <span className="font-semibold text-text-dark">
              {formatUtils.number(stats.uniqueCustomers)}
            </span>
          </div>
        )}
        
        {/* Display memoized extra stats */}
        {extraStats}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.title === nextProps.title &&
    JSON.stringify(prevProps.stats) === JSON.stringify(nextProps.stats) &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.onClick === nextProps.onClick
  );
});

CategoryCard.propTypes = {
  title: PropTypes.string.isRequired,
  stats: PropTypes.shape({
    totalBookings: PropTypes.number,
    totalCollection: PropTypes.number,
    totalBalance: PropTypes.number,
    uniqueCustomers: PropTypes.number
  }),
  config: PropTypes.shape({
    extraStats: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      calculate: PropTypes.func.isRequired
    }))
  }),
  onClick: PropTypes.func
};

export default CategoryCard;