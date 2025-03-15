import { useEffect, useState, useMemo, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { statsService } from '../../services/statsService';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import StatsCard from './StatsCard';
import Loading from '../common/Loading';
import PropTypes from 'prop-types';
import { withErrorBoundary } from '../common/ErrorBoundary';
import React from 'react';
import { useErrorTracker } from '../../hooks/useErrorTracker';

// Fallback component for error states
const StatsFallback = ({ error }) => (
  <div className="p-4 bg-error-light rounded-lg text-error">
    <h3 className="font-semibold mb-2">Error Loading Statistics</h3>
    <p className="text-sm">{error?.message || 'An unexpected error occurred'}</p>
  </div>
);

/**
 * SummaryStats component for displaying booking statistics
 */
function SummaryStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { handleError, handleAsync } = useErrorHandler();

  useEffect(() => {
    const calculateStats = async () => {
      if (!filteredData || filteredData.length === 0) {
        setStats(null);
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('[SummaryStats] Calculating summary statistics');
        
        // Handle group data operations with async error handling
        const result = await handleAsync(
          async () => {
            await Promise.all([
              groupData('month'),
              groupData('location'),
              groupData('status'),
              groupData('payment'),
              groupData('source')
            ]);
            
            return await statsService.calculateSummaryStats(filteredData);
          },
          'SummaryStats.calculateStats',
          {
            severity: ErrorSeverity.ERROR,
            category: ErrorCategory.DATA,
            metadata: {
              dataLength: filteredData.length,
              operation: 'calculateStats'
            },
            rethrow: true // We want to catch this in the outer try-catch
          }
        );

        if (!result.error) {
          setStats(result);
        }
      } catch (error) {
        handleError(
          error,
          'SummaryStats.calculateStats',
          ErrorSeverity.ERROR,
          ErrorCategory.DATA,
          {
            dataLength: filteredData.length,
            errorMessage: error.message
          }
        );
        // Re-throw the error to be caught by the ErrorBoundary
        throw new Error('Failed to calculate statistics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Use handleAsync for the top-level async operation
    handleAsync(
      calculateStats,
      'SummaryStats.effect',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          operation: 'effectCalculation'
        }
      }
    ).catch(error => {
      console.error('[SummaryStats] Unhandled error in calculateStats:', error);
    });
  }, [filteredData, groupData, handleAsync, handleError]);

  // If loading, show loading indicator
  if (isLoading) {
    return <Loading size="sm" message="Calculating statistics..." className="my-6" />;
  }

  // If no stats or data, don't render anything
  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          type="number"
        />
        <StatsCard
          title="Total Revenue"
          value={stats.totalCollection}
          type="currency"
        />
        <StatsCard
          title="Total Slots"
          value={stats.totalSlots}
          type="number"
        />
        <StatsCard
          title="Unique Customers"
          value={stats.uniqueCustomers}
          type="number"
        />
      </div>

      {/* Status Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Confirmed"
            value={stats.statusStats.confirmed}
            subValue={`${Math.round(stats.statusStats.confirmationRate)}%`}
            type="number"
          />
          <StatsCard
            title="Cancelled"
            value={stats.statusStats.cancelled}
            type="number"
          />
          <StatsCard
            title="Partially Cancelled"
            value={stats.statusStats.partially_cancelled}
            type="number"
          />
        </div>
      </div>

      {/* Payment Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Cash Payments"
            value={stats.paymentStats.cash.amount}
            subValue={`${Math.round(stats.paymentStats.cash.percentage)}%`}
            type="currency"
          />
          <StatsCard
            title="Bank Transfers"
            value={stats.paymentStats.bank.amount}
            subValue={`${Math.round(stats.paymentStats.bank.percentage)}%`}
            type="currency"
          />
          <StatsCard
            title="Hudle Payments"
            value={stats.paymentStats.hudle.amount}
            subValue={`${Math.round(stats.paymentStats.hudle.percentage)}%`}
            type="currency"
          />
        </div>
      </div>

      {/* Booking Source */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Booking Source</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="Online Bookings"
            value={stats.sourceStats.online}
            subValue={`${Math.round(stats.sourceStats.onlinePercentage)}%`}
            type="number"
          />
          <StatsCard
            title="Offline Bookings"
            value={stats.sourceStats.offline}
            subValue={`${Math.round(100 - stats.sourceStats.onlinePercentage)}%`}
            type="number"
          />
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.monthlyStats.map(month => (
            <div key={month.month} className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold text-primary">{month.month}</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <StatsCard
                  title="Bookings"
                  value={month.bookings}
                  type="number"
                  size="sm"
                />
                <StatsCard
                  title="Revenue"
                  value={month.revenue}
                  type="currency"
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CustomSummaryStats component for displaying custom statistics
 */
const CustomSummaryStats = React.memo(function CustomSummaryStats({ 
  customStats,
  statsToShow,
  className = ''
}) {
  const { trackError } = useErrorTracker();

  // Memoize stats entries
  const statsEntries = useMemo(() => {
    if (!customStats) return [];
    return statsToShow 
      ? Object.entries(customStats).filter(([key]) => statsToShow.includes(key))
      : Object.entries(customStats);
  }, [customStats, statsToShow]);

  // Memoize stats cards
  const statsCards = useMemo(() => {
    return statsEntries.map(([key, value]) => {
      try {
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
      } catch (error) {
        trackError(
          error,
          'CustomSummaryStats.renderStat',
          ErrorSeverity.WARNING,
          ErrorCategory.UI,
          { key, valueType: typeof value }
        );
        return null;
      }
    }).filter(Boolean);
  }, [statsEntries, trackError]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {statsCards}
    </div>
  );
});

CustomSummaryStats.propTypes = {
  customStats: PropTypes.object,
  statsToShow: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string
};

// Wrap components with error boundaries
const CustomSummaryStatsWithError = withErrorBoundary(
  CustomSummaryStats,
  {
    fallback: StatsFallback,
    context: 'CustomSummaryStats',
    metadata: {
      feature: 'custom-statistics',
      importance: 'medium'
    }
  }
);

const SummaryStatsWithError = withErrorBoundary(
  React.memo(function SummaryStats(props) {
    return <CustomSummaryStats {...props} />;
  }),
  {
    fallback: StatsFallback,
    context: 'SummaryStats',
    metadata: {
      feature: 'statistics',
      importance: 'high'
    }
  }
);

export { CustomSummaryStatsWithError as CustomSummaryStats };
export default SummaryStatsWithError;