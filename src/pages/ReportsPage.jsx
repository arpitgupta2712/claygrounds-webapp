import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PageTitle from '../components/common/PageTitle';
import GlobalReport from '../components/reports/GlobalReport';
import YearSelector from '../components/common/YearSelector';
import FilterSelector from '../components/filters/FilterSelector';
import ExportOptions from '../components/exports/ExportOptions';
import VisualizationDashboard from '../components/dashboard/VisualizationDashboard';
import PerformanceMonitor from '../components/dev/PerformanceMonitor';

/**
 * Reports page component displaying various report views
 */
function ReportsPage() {
  const [activeTab, setActiveTab] = useState('standard');
  const { filteredData } = useApp();

  // Tab options
  const tabs = [
    { id: 'standard', label: 'Standard Reports' },
    { id: 'visualizations', label: 'Visualizations' },
    { id: 'export', label: 'Export Reports' }
  ];

  return (
    <>
      <PerformanceMonitor />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <PageTitle title="Reports & Analytics" />
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <YearSelector />
            <FilterSelector />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium text-sm md:text-base border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Standard Reports Tab */}
          {activeTab === 'standard' && (
            <GlobalReport />
          )}

          {/* Visualizations Tab */}
          {activeTab === 'visualizations' && (
            <div>
              <p className="text-gray-600 mb-6">
                Interactive visualizations to help analyze booking data across payment methods, status types, and booking sources.
              </p>
              <VisualizationDashboard />
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <p className="text-gray-600 mb-6">
                Export reports in various formats to share with stakeholders or for further analysis.
              </p>
              <ExportOptions data={filteredData} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ReportsPage; 