import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';

/**
 * DailyView component for displaying payment data in a daily format
 */
function DailyView({ year }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Payments View</h3>
      <p className="text-gray-500">Daily view for year: {year}</p>
      {/* Table will be implemented based on your requirements */}
    </div>
  );
}

DailyView.propTypes = {
  year: PropTypes.string.isRequired
};

export default DailyView; 