import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { statsService } from '../../services/statsService';
import { PaymentDistribution, StatusDistribution, SourceDistribution } from '../visualizations';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

/**
 * VisualizationDashboard component that displays all visualization components
 * @param {Object} props - Component props
 * @param {boolean} props.compact - Whether to display in compact mode
 */
function VisualizationDashboard({ compact = false }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { trackError } = useErrorTracker();

  // Calculate statistics when data changes
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setStats(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('[VisualizationDashboard] Calculating summary statistics');
      
      // Ensure we have all required groupings
      groupData('payment');
      groupData('status');
      groupData('source');
      
      const calculatedStats = statsService.calculateSummaryStats(filteredData);
      setStats(calculatedStats);
    } catch (error) {
      console.error('[VisualizationDashboard] Error calculating statistics:', error);
      trackError(
        error,
        'VisualizationDashboard.calculateStats',
        'ERROR',
        'DATA'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, groupData, trackError]);

  if (isLoading) {
    return <Loading size="sm" message="Preparing visualizations..." className="my-6" />;
  }

  if (!stats) {
    return (
      <EmptyState
        title="No data available"
        message="Apply filters or load data to view visualizations."
      />
    );
  }

  // Compact mode shows visualizations in a condensed view for embedding in other pages
  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaymentDistribution data={stats} className="h-full" />
        <StatusDistribution data={stats} className="h-full" />
        <SourceDistribution data={stats} className="h-full" />
      </div>
    );
  }

  // Full view shows visualizations with more detail and organization
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Booking Visualizations</h2>
        <p className="text-gray-600">
          Visual analytics based on {filteredData.length} bookings. Toggle between chart types for different perspectives.
        </p>
      </div>

      {/* Payment Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-primary mb-4">Payment Analysis</h3>
        <PaymentDistribution data={stats} />
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-primary mb-4">Status Analysis</h3>
        <StatusDistribution data={stats} />
      </div>

      {/* Source Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-primary mb-4">Source Analysis</h3>
        <SourceDistribution data={stats} />
      </div>
    </div>
  );
}

export default VisualizationDashboard; 