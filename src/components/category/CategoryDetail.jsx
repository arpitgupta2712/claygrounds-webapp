import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';
import BaseModal from '../common/BaseModal';

const CategoryDetail = React.memo(function CategoryDetail({ category, onClose }) {
  const { title, stats, config } = category;

  // Format stat value for display
  const formatStatValue = useCallback((value, type = 'number') => {
    if (value === undefined || value === null) return 'N/A';
    
    // Handle Top Customer object structure
    if (typeof value === 'object' && value.displayText) {
      return value.displayText;
    }
    
    switch (type) {
      case 'currency':
        return formatUtils.currency(value);
      case 'percentage':
        return formatUtils.percentage(value);
      case 'date':
        return formatUtils.date(value);
      default:
        // If the value already includes a % sign, return as is
        if (typeof value === 'string' && value.includes('%')) {
          return value;
        }
        return typeof value === 'string' ? value : formatUtils.number(value);
    }
  }, []);

  // Memoize detailed stats
  const detailedStats = useMemo(() => {
    if (!stats) return [];

    // Only log in development and with a more specific identifier
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CategoryDetail][${title}] Processing stats for category type: ${config.category}`);
    }

    const baseStats = [
      { label: 'Total Bookings', value: stats.totalBookings },
      { label: 'Total Collection', value: stats.totalCollection, type: 'currency' },
      { label: 'Total Outstanding', value: stats.totalBalance, type: 'currency' },
      { label: 'Unique Customers', value: stats.uniqueCustomers }
    ];

    // Add extra stats from config
    const extraStats = config?.extraStats?.map(extraStat => {
      const value = stats[extraStat.label];
      
      // Only log in development and when debugging is needed
      if (process.env.NODE_ENV === 'development' && value === undefined) {
        console.warn(`[CategoryDetail][${title}] Missing value for extraStat: ${extraStat.label}`);
      }
      
      // For percentage values that are already formatted (contain %), don't apply percentage formatting
      const type = typeof value === 'string' && value.includes('%') ? 'text' : (extraStat.type || 'text');
      return {
        label: extraStat.label,
        value: value,
        type: type
      };
    }) || [];

    const allStats = [...baseStats, ...extraStats].filter(stat => stat.value !== undefined);
    
    // Only log in development and with a more specific identifier
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CategoryDetail][${title}] Generated ${allStats.length} stats`);
    }
    
    return allStats;
  }, [stats, config, title]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`${title} Details`}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {detailedStats.map(({ label, value, type }) => (
          <div 
            key={label}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">
              {formatStatValue(value, type)}
            </div>
          </div>
        ))}
      </div>

      {/* Additional category-specific content based on config */}
      {config?.detailContent && (
        <div className="mt-6">
          {config.detailContent(stats)}
        </div>
      )}
    </BaseModal>
  );
});

CategoryDetail.propTypes = {
  category: PropTypes.shape({
    title: PropTypes.string.isRequired,
    stats: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default CategoryDetail;