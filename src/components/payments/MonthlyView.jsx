import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { statsService } from '../../services/statsService';
import { dataUtils } from '../../utils/dataUtils';
import { useCallback } from 'react';

/**
 * MonthlyView component for displaying payment data in a monthly format
 */
function MonthlyView({ year }) {
  const { filteredData } = useApp();
  
  // Return early if no booking data is available
  if (!filteredData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Payments View</h3>
        <p className="text-gray-500 mb-6">Monthly view for year: {year}</p>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading payment data...</p>
        </div>
      </div>
    );
  }
  
  // Calculate monthly payments
  const monthlyPayments = statsService.calculateMonthlyPayments(filteredData);

  // Return early if no monthly payments data
  if (!monthlyPayments || monthlyPayments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Payments View</h3>
        <p className="text-gray-500 mb-6">Monthly view for year: {year}</p>
        <div className="text-center py-8">
          <p className="text-gray-500">No payment data available for the selected period.</p>
        </div>
      </div>
    );
  }

  // Function to export monthly payments to CSV
  const exportToCSV = useCallback(() => {
    const csvRows = [];
    const headers = ['Month', 'Cash', 'Bank', 'Hudle', 'Total'];
    csvRows.push(headers.join(','));

    monthlyPayments.forEach(monthData => {
      const row = [
        monthData.month,
        monthData.cashAmount,
        monthData.bankAmount,
        monthData.hudleAmount,
        monthData.totalAmount
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `monthly_payments_${year}.csv`);
    a.click();
  }, [monthlyPayments, year]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Payments View</h3>
      <p className="text-gray-500 mb-6">Monthly view for year: {year}</p>
      <button onClick={exportToCSV} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">
        Export to CSV
      </button>
      
      {/* Monthly Payments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-primary">
              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                Month
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                Cash
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                Bank
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                Hudle
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monthlyPayments.map((monthData, index) => (
              <tr key={monthData.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold uppercase text-primary">
                  {monthData.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  ₹{dataUtils.formatNumber(monthData.cashAmount)}
                  <span className="text-gray-500 text-xs ml-1">({monthData.cashPercentage.toFixed(1)}%)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  ₹{dataUtils.formatNumber(monthData.bankAmount)}
                  <span className="text-gray-500 text-xs ml-1">({monthData.bankPercentage.toFixed(1)}%)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  ₹{dataUtils.formatNumber(monthData.hudleAmount)}
                  <span className="text-gray-500 text-xs ml-1">({monthData.hudlePercentage.toFixed(1)}%)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-primary">
                  ₹{dataUtils.formatNumber(monthData.totalAmount)}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-primary bg-opacity-10 font-medium">
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary uppercase">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                ₹{dataUtils.formatNumber(monthlyPayments.reduce((sum, month) => sum + month.cashAmount, 0))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                ₹{dataUtils.formatNumber(monthlyPayments.reduce((sum, month) => sum + month.bankAmount, 0))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                ₹{dataUtils.formatNumber(monthlyPayments.reduce((sum, month) => sum + month.hudleAmount, 0))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                ₹{dataUtils.formatNumber(monthlyPayments.reduce((sum, month) => sum + month.totalAmount, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

MonthlyView.propTypes = {
  year: PropTypes.string.isRequired
};

export default MonthlyView; 