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

function StatsFallback({ error }) {
  return (
    <div className="bg-error-light p-6 rounded-lg border border-error mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-error">Statistics Error</h3>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-white text-error border border-error rounded hover:bg-error hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
      <p className="text-gray-600">{error?.message || 'Error calculating statistics'}</p>
    </div>
  );
}

StatsFallback.propTypes = {
  error: PropTypes.object
};

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
 * SummaryStats component with custom statistics
 * @param {Object} props - Component props
 * @param {Object} props.customStats - Custom statistics object to display
 * @param {string[]} props.statsToShow - Array of stat keys to show
 * @param {string} props.className - Additional CSS classes
 */
const CustomSummaryStats = memo(function CustomSummaryStats({ customStats, statsToShow, className = '' }) {
  const { handleError } = useErrorHandler();

  // Filter stats to show if specified
  const statsEntries = useMemo(() => {
    try {
      if (!customStats) return [];
      return statsToShow && statsToShow.length > 0
        ? Object.entries(customStats).filter(([key]) => statsToShow.includes(key))
        : Object.entries(customStats);
    } catch (error) {
      handleError(
        error,
        'CustomSummaryStats.filterStats',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { statsToShow }
      );
      return [];
    }
  }, [customStats, statsToShow, handleError]);

  // If no stats, don't render anything
  if (!customStats) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {statsEntries.map(([key, value]) => {
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
          handleError(
            error,
            'CustomSummaryStats.renderStat',
            ErrorSeverity.WARNING,
            ErrorCategory.UI,
            { key, valueType: typeof value }
          );
          return null;
        }
      })}
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
  memo(SummaryStats),
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