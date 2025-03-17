import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBookings } from '../hooks/useBookings';
import PageTitle from '../components/common/PageTitle';
import SummaryStats from '../components/summary/SummaryStats';
import YearSelector from '../components/common/YearSelector';
import FilterSelector from '../components/filters/FilterSelector';
import VisualizationDashboard from '../components/dashboard/VisualizationDashboard';
import { Routes, Route, Navigate } from 'react-router-dom';
import VisualizationsPage from './VisualizationsPage';
import TableView from '../components/table/TableView';
import PaymentsView from '../components/payments/PaymentsView';
import ErrorDashboard from '../components/error/ErrorDashboard';

/**
 * Dashboard page component displaying summary statistics and quick actions
 */
function HomeView() {
  const { selectedYear } = useApp();
  const { loadBookings, filteredData } = useBookings();

  // Load data when the component mounts
  useEffect(() => {
    loadBookings(selectedYear);
  }, [loadBookings, selectedYear]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Routes>
        <Route path="visualizations" element={<VisualizationsPage />} />
        <Route path="table" element={<TableView />} />
        <Route path="payments" element={<PaymentsView />} />
        <Route path="errors" element={<ErrorDashboard />} />
        <Route path="/" element={<Navigate to="visualizations" replace />} />
      </Routes>

      {/* Header section with title and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <PageTitle title="Dashboard" />
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <YearSelector />
          <FilterSelector />
        </div>
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
    </div>
  );
}

export default HomeView; 