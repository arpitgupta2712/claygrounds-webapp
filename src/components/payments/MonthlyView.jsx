import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';

/**
 * MonthlyView component for displaying payment data in a monthly format
 */
function MonthlyView({ year }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Payments View</h3>
      <p className="text-gray-500">Monthly view for year: {year}</p>
      {/* Table will be implemented based on your requirements */}
    </div>
  );
}

MonthlyView.propTypes = {
  year: PropTypes.string.isRequired
};

export default MonthlyView; 