import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { chartService } from '../../services/chartService';
import { withErrorBoundary } from '../common/ErrorBoundary';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { SummaryStats } from '../summary/SummaryStats';
import ChartComponent from '../charts/ChartComponent';

function CategoryFallback({ error }) {
  return (
    <div className="bg-error-light p-6 rounded-lg border border-error mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-error">Category View Error</h3>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-white text-error border border-error rounded hover:bg-error hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
      <p className="text-gray-600">{error?.message || 'Error loading category data'}</p>
    </div>
  );
}

CategoryFallback.propTypes = {
  error: PropTypes.object
};

function CategoryView({ type }) {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { filteredData } = useApp();
  const { groupData } = useBookings();
  const { handleAsync, handleError } = useErrorHandler();
  
  // Used to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useCallback(() => {
    const mounted = { current: true };
    return () => mounted.current;
  }, [])();

  const prepareChartData = useCallback(async () => {
    // Skip if no data to process
    if (!filteredData || filteredData.length === 0) {
      setChartData(null);
      setIsLoading(false);
      return;
    }

    try {
      await handleAsync(
        async () => {
          console.log(`[CategoryView] Preparing chart data for type: ${type} with ${filteredData.length} records`);
          
          // Group data by category
          await groupData(type);
          
          // Generate chart data
          const data = await chartService.generateChartData(filteredData, type);
          
          // Only update state if component is still mounted
          if (isMountedRef()) {
            setChartData(data);
          }
        },
        'CategoryView.prepareChartData',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.DATA,
          metadata: {
            viewType: type,
            dataLength: filteredData.length
          }
        }
      );
    } catch (error) {
      handleError(
        error,
        'CategoryView.prepareChartData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        {
          viewType: type,
          dataLength: filteredData.length
        }
      );
      if (isMountedRef()) {
        setChartData(null);
      }
    } finally {
      if (isMountedRef()) {
        setIsLoading(false);
      }
    }
  }, [type, groupData, handleAsync, handleError, filteredData, isMountedRef]);

  // Effect to handle data changes
  useEffect(() => {
    // Debug logs
    console.log(`[CategoryView] Data or type changed - type: ${type}, data length: ${filteredData?.length || 0}`);
    
    // Set loading state and prepare chart data
    setIsLoading(true);
    prepareChartData();
    
    // Cleanup function
    return () => {
      console.log(`[CategoryView] Cleaning up effect for type: ${type}`);
    };
  }, [filteredData, type, prepareChartData]);

  const handleChartClick = useCallback(async (event, data) => {
    try {
      await handleAsync(
        async () => {
          console.log('[CategoryView] Chart clicked:', data);
          // Handle chart click event
          // Add your chart click handling logic here
        },
        'CategoryView.handleChartClick',
        {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.UI,
          metadata: {
            viewType: type,
            clickedData: data
          }
        }
      );
    } catch (error) {
      handleError(
        error,
        'CategoryView.handleChartClick',
        ErrorSeverity.WARNING,
        ErrorCategory.UI,
        {
          viewType: type,
          clickedData: data
        }
      );
    }
  }, [type, handleAsync, handleError]);

  // Show loading state
  if (isLoading) {
    return <Loading message={`Loading ${type} data...`} />;
  }

  // Show empty state if no chart data
  if (!chartData) {
    return (
      <EmptyState
        title={`No ${type} data available`}
        message={`There is no data to display for the selected ${type} view.`}
      />
    );
  }

  // Render the category view with charts
  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <SummaryStats customStats={chartData.stats} />
      
      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 capitalize">{type} Distribution</h2>
        <ChartComponent
          data={chartData.chartData}
          type={chartData.chartType}
          options={chartData.options}
          onChartClick={handleChartClick}
        />
      </div>
    </div>
  );
}

CategoryView.propTypes = {
  type: PropTypes.oneOf(['locations', 'months', 'sports', 'status', 'source']).isRequired
};

// Wrap CategoryView with error boundary
export default withErrorBoundary(CategoryView, {
  fallback: CategoryFallback,
  context: 'CategoryView',
  metadata: {
    feature: 'category-view',
    importance: 'high'
  }
});