import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBookings } from '../hooks/useBookings';
import PageTitle from '../components/common/PageTitle';
import SummaryStats from '../components/summary/SummaryStats';
import RecentBookings from '../components/dashboard/RecentBookings';
import QuickActions from '../components/dashboard/QuickActions';
import YearSelector from '../components/common/YearSelector';
import FilterSelector from '../components/filters/FilterSelector';
import VisualizationDashboard from '../components/dashboard/VisualizationDashboard';

/**
 * Dashboard page component displaying summary statistics and quick actions
 */
function DashboardPage() {
  const { selectedYear } = useApp();
  const { loadBookings, filteredData } = useBookings();

  // Load data when the component mounts
  useEffect(() => {
    loadBookings(selectedYear);
  }, [loadBookings, selectedYear]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header section with title and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <PageTitle title="Dashboard" />
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <YearSelector />
          <FilterSelector />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Summary Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Overview</h2>
        <SummaryStats />
      </div>

      {/* Visualization Overview */}
      {filteredData && filteredData.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">Visual Analytics</h2>
            <a 
              href="/reports?tab=visualizations" 
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              View Detailed Visualizations →
            </a>
          </div>
          <VisualizationDashboard compact={true} />
        </div>
      )}

      {/* Recent Bookings */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Recent Bookings</h2>
          <a 
            href="/bookings" 
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            View All Bookings →
          </a>
        </div>
        <RecentBookings limit={5} />
      </div>
    </div>
  );
}

export default DashboardPage; 