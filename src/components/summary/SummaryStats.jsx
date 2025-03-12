import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { statsService } from '../../services/statsService';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import StatsCard from './StatsCard';
import Loading from '../common/Loading';

/**
 * SummaryStats component for displaying booking statistics
 */
function SummaryStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { filteredData } = useApp();
  const { trackError } = useErrorTracker();

  // Calculate statistics when data changes
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setStats(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('[SummaryStats] Calculating summary statistics');
      const calculatedStats = statsService.calculateSummaryStats(filteredData);
      setStats(calculatedStats);
    } catch (error) {
      console.error('[SummaryStats] Error calculating statistics:', error);
      trackError(
        error,
        'SummaryStats.calculateStats',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, trackError]);

  // If loading, show loading indicator
  if (isLoading) {
    return <Loading size="sm" message="" className="my-6" />;
  }

  // If no stats or data, don't render anything
  if (!stats) {
    return null;
  }

  return (
    <div className="my-6 md:my-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6">
        <StatsCard 
          title="Total Bookings" 
          value={stats.totalBookings} 
          type="number"
        />
        
        <StatsCard 
          title="Total Slots" 
          value={stats.totalSlots} 
          type="number"
        />
        
        <StatsCard 
          title="Completion Rate" 
          value={stats.completionRate} 
          type="percentage"
          colorClass={stats.completionRate > 80 ? "text-success" : stats.completionRate > 50 ? "text-warning" : "text-error"}
        />
        
        <StatsCard 
          title="Total Collection" 
          value={stats.totalCollection} 
          type="currency"
        />
        
        <StatsCard 
          title="Outstanding Balance" 
          value={stats.totalBalance} 
          type="currency"
          colorClass={stats.totalBalance > 0 ? "text-error" : "text-text-dark"}
        />
        
        <StatsCard 
          title="Unique Customers" 
          value={stats.uniqueCustomers} 
          type="number"
        />
      </div>
    </div>
  );
}

/**
 * SummaryStats component with custom statistics
 * @param {Object} props - Component props
 * @param {Object} props.customStats - Custom statistics object to display
 * @param {string[]} props.statsToShow - Array of stat keys to show
 * @param {string} props.className - Additional CSS classes
 */
export function CustomSummaryStats({ customStats, statsToShow, className = '' }) {
  // If no stats, don't render anything
  if (!customStats) {
    return null;
  }

  // Filter stats to show if specified
  const statsEntries = statsToShow && statsToShow.length > 0
    ? Object.entries(customStats).filter(([key]) => statsToShow.includes(key))
    : Object.entries(customStats);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {statsEntries.map(([key, value]) => {
        // Skip functions and internal properties
        if (typeof value === 'function' || key.startsWith('_')) {
          return null;
        }
        
        // Format the title from camelCase to Title Case
        const title = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        
        // Determine type based on key name or value type
        let type = 'text';
        if (typeof value === 'number') {
          // Detect type based on key name
          if (key.includes('revenue') || key.includes('paid') || 
              key.includes('balance') || key.includes('price')) {
            type = 'currency';
          } else if (key.includes('rate') || key.includes('percentage')) {
            type = 'percentage';
          } else {
            type = 'number';
          }
        }
        
        return (
          <StatsCard
            key={key}
            title={title}
            value={value}
            type={type}
          />
        );
      })}
    </div>
  );
}

export default SummaryStats;