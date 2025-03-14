import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { formatUtils } from '../../utils/formatUtils';

/**
 * StatsCard component for displaying individual statistics
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main statistic value
 * @param {string} props.type - Type of value (number, currency, percentage)
 * @param {string} props.icon - Optional icon component
 * @param {Object} props.trend - Trend data with value and direction
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Additional content
 */
const StatsCard = memo(function StatsCard({
  title,
  value,
  type = 'text',
  icon,
  trend,
  isLoading = false,
  className = '',
  onClick,
  children
}) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-md p-7 shadow transition duration-300 min-h-[140px] flex flex-col justify-center items-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          {trend && <div className="h-3 bg-gray-200 rounded w-1/3"></div>}
        </div>
      </div>
    );
  }

  // Format value based on type
  const formattedValue = useMemo(() => {
    switch (type) {
      case 'currency':
        return formatUtils.currency(value);
      case 'percentage':
        return formatUtils.percentage(value, 1); // Always use 1 decimal place for percentages
      case 'number':
        return formatUtils.number(value);
      default:
        return value;
    }
  }, [type, value]);

  // Determine card styling based on props
  const cardClasses = useMemo(() => `
    bg-white rounded-md p-7 shadow 
    transition duration-300 
    min-h-[140px] w-full
    flex flex-col justify-center items-center
    ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''}
    ${className}
  `, [onClick, className]);

  // Render trend indicator if provided
  const renderTrend = useMemo(() => {
    if (!trend) return null;
    
    const { value: trendValue, direction } = trend;
    const isPositive = direction === 'up';
    const isNegative = direction === 'down';
    
    // Only render if we have a direction
    if (!isPositive && !isNegative) return null;
    
    return (
      <div className={`flex items-center gap-1.5 mt-2 text-sm ${isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-text-light'}`}>
        {isPositive && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )}
        {isNegative && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span>{trendValue}</span>
      </div>
    );
  }, [trend]);

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-text-light uppercase tracking-wider mb-2 text-center">{title}</h3>
      
      <div className="flex flex-col items-center justify-center w-full">
        {icon && <div className="mb-2">{icon}</div>}
        <div className="w-full text-center">
          <p className="text-xl font-normal text-primary font-mono tracking-tight break-all">{formattedValue}</p>
        </div>
      </div>
      
      {renderTrend}
      
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
});

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.oneOf(['text', 'number', 'currency', 'percentage']),
  icon: PropTypes.node,
  trend: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    direction: PropTypes.oneOf(['up', 'down', 'neutral'])
  }),
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node
};

export default StatsCard;