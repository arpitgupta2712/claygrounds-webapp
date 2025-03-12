import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import MonthlyView from './MonthlyView';
import DailyView from './DailyView';

/**
 * PaymentsView component for displaying payment data in monthly or daily view
 */
function PaymentsView() {
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'daily'
  const { selectedYear } = useApp();

  return (
    <div className="animate-fadeIn">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary">Payments Overview</h2>
        
        {/* View toggle buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewType === 'monthly'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setViewType('daily')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewType === 'daily'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Daily View
          </button>
        </div>
      </div>

      {/* Render appropriate view based on selection */}
      {viewType === 'monthly' ? (
        <MonthlyView year={selectedYear} />
      ) : (
        <DailyView year={selectedYear} />
      )}
    </div>
  );
}

export default PaymentsView; 