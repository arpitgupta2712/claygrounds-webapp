import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBookings } from '../hooks/useBookings';
import PageTitle from '../components/common/PageTitle';
import VisualizationDashboard from '../components/dashboard/VisualizationDashboard';

/**
 * Visualizations page component providing focused visualization experience
 */
function VisualizationsPage() {
  const { selectedYear } = useApp();
  const { loadBookings } = useBookings();

  // Load data when the component mounts
  useEffect(() => {
    loadBookings(selectedYear);
  }, [loadBookings, selectedYear]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header section with title and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <PageTitle title="Dashboard" />
          <p className="text-gray-600 mt-2">
            Interactive visual analytics for booking data.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <VisualizationDashboard />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-700">Visualization Tips</h3>
            <div className="mt-2 text-sm text-blue-600">
              <ul className="list-disc pl-5 space-y-1">
                <li>Toggle between chart types using the buttons above each chart</li>
                <li>Hover over chart elements to see detailed information</li>
                <li>Use the filter selector to focus on specific data segments</li>
                <li>Each visualization includes a summary table for exact figures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualizationsPage; 