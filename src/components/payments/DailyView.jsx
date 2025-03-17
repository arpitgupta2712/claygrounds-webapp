/**
 * DailyView.jsx
 * Component for displaying payment data in a daily format
 */
import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { statsService } from '../../services/statsService';
import { getFinancialYearDates } from '../../utils/dateUtils';
import { formatUtils } from '../../utils/formatUtils';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

/**
 * DailyView component for displaying payment data in a daily format
 */
function DailyView({ year }) {
  const [dailyPayments, setDailyPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filteredData } = useApp();
  
  useEffect(() => {
    const fetchDailyPayments = async () => {
      setLoading(true);
      try {
        console.log(`[DailyView] Calculating daily payments for year: ${year}`);
        
        // Use filteredData from AppContext
        if (!filteredData || !filteredData.length) {
          console.warn('[DailyView] No filtered data available');
          // For development/testing purposes, you can create sample data here
          if (process.env.NODE_ENV === 'development') {
            console.log('[DailyView] Creating sample data for development');
            // Create sample data with dates in current financial year
            const startYear = year.substring(0, 4);
            const sampleData = [
              {
                'Slot Date': `15/04/${startYear}`,
                'Cash': 500,
                'UPI': 0,
                'Bank Transfer': 0,
                'Hudle App': 0
              },
              {
                'Slot Date': `25/05/${startYear}`,
                'Cash': 0,
                'UPI': 300,
                'Bank Transfer': 200,
                'Hudle App': 0
              },
              {
                'Slot Date': `10/01/${Number(startYear) + 1}`,
                'Cash': 0,
                'UPI': 0,
                'Bank Transfer': 0,
                'Hudle App': 1000
              }
            ];
            const payments = statsService.calculateDailyPaymentsByMode(sampleData, year);
            console.log(`[DailyView] Processed sample daily payments for ${Object.keys(payments).length} days`);
            setDailyPayments(payments);
          } else {
            setError('No booking data available for processing');
          }
          setLoading(false);
          return;
        }
        
        // Validate some records in filteredData
        if (filteredData.length > 0) {
          const sample = filteredData[0];
          console.log('[DailyView] Data sample for debugging:', {
            hasSlotDate: 'Slot Date' in sample,
            slotDateFormat: sample['Slot Date'],
            hasCash: 'Cash' in sample,
            cashValue: sample['Cash']
          });
        }
        
        // Calculate daily payments using the service
        const payments = statsService.calculateDailyPaymentsByMode(filteredData, year);
        console.log(`[DailyView] Processed daily payments for ${Object.keys(payments).length} days`);
        
        // If no payments were found, check a few records to debug
        if (Object.keys(payments).length === 0 && filteredData.length > 0) {
          // Manually check if some dates are in the financial year as a debugging step
          const startYear = parseInt(year.substring(0, 4), 10);
          const endYear = startYear + 1;
          
          console.log(`[DailyView] Debugging: Checking if dates fall in financial year ${startYear}-${endYear}`);
          filteredData.slice(0, 5).forEach(booking => {
            const date = booking['Slot Date'];
            if (date) {
              const dateParts = date.split('/');
              if (dateParts.length === 3) {
                const month = parseInt(dateParts[1], 10);
                const dateYear = parseInt(dateParts[2], 10);
                
                const isInYear = (dateYear === startYear && month >= 4) || 
                                (dateYear === endYear && month <= 3);
                                
                console.log(`[DailyView] Date check: ${date} - In FY ${startYear}-${endYear}: ${isInYear}`);
              }
            }
          });
        }
        
        setDailyPayments(payments);
      } catch (error) {
        console.error('[DailyView] Error fetching daily payments:', error);
        setError(error.message || 'Error processing payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyPayments();
  }, [year, filteredData]);

  // Generate an array of dates for the selected financial year
  const generateDateArray = () => {
    try {
      // Parse year format "202425" to create proper start and end dates
      const startYear = year.substring(0, 4);
      const endYear = String(Number(startYear) + 1);
      
      // Create dates for April 1st of start year and March 31st of end year
      const startDate = new Date(`${startYear}-04-01`);
      const endDate = new Date(`${endYear}-03-31`);
      
      console.log(`[DailyView] Generating date array from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      
      // Guard against invalid dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('[DailyView] Invalid date conversion:', { startYear, endYear });
        return [];
      }
      
      const dateArray = [];
      // Create array of all dates in the financial year
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Format as DD/MM/YYYY to match the keys in dailyPayments
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear();
        
        dateArray.push(`${day}/${month}/${year}`);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`[DailyView] Generated ${dateArray.length} dates`);
      return dateArray;
    } catch (error) {
      console.error('[DailyView] Error generating date array:', error);
      return [];
    }
  };

  const dateArray = generateDateArray();

  // Function to export daily payments to CSV
  const exportToCSV = useCallback(() => {
    const csvRows = [];
    const headers = ['Date', 'Cash', 'Bank', 'Hudle', 'Total'];
    csvRows.push(headers.join(','));

    dateArray.forEach((date, index) => {
      const payments = dailyPayments[date] || { Cash: 0, Bank: 0, Hudle: 0 };
      const totalForDay = payments.Cash + payments.Bank + payments.Hudle;

      // Skip rows with no payments
      if (totalForDay > 0) {
        const row = [
          date,
          payments.Cash,
          payments.Bank,
          payments.Hudle,
          totalForDay
        ];
        csvRows.push(row.join(','));
      }
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `daily_payments_${year}.csv`);
    a.click();
  }, [dailyPayments, dateArray, year]);

  if (loading) {
    return <Loading message="Processing daily payment data..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Payment Data"
        message={error}
        icon="error"
      />
    );
  }

  if (dateArray.length === 0) {
    return (
      <EmptyState
        title="No Date Range Available"
        message={`Could not determine date range for financial year ${year}`}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Payments View</h3>
      <p className="text-gray-500 mb-4">Daily payment breakdown for financial year: {year.substring(0, 4)}-{year.substring(4, 6)}</p>
      <button onClick={exportToCSV} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">
        Export to CSV
      </button>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-background-light">
            <tr>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">#</th>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">Date</th>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">Cash</th>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">Bank</th>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">Hudle</th>
              <th className="border border-gray-300 p-2 text-text-dark font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {dateArray.map((date, index) => {
              const payments = dailyPayments[date] || { Cash: 0, Bank: 0, Hudle: 0 };
              const totalForDay = payments.Cash + payments.Bank + payments.Hudle;
              
              // Skip rows with no payments to keep the table concise
              if (totalForDay === 0) return null;
              
              return (
                <tr key={date} className={index % 2 === 0 ? 'bg-white' : 'bg-background-light'}>
                  <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-2 text-center font-medium">{date}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatUtils.currency(payments.Cash)}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatUtils.currency(payments.Bank)}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatUtils.currency(payments.Hudle)}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{formatUtils.currency(totalForDay)}</td>
                </tr>
              );
            })}
            
            {/* Summary row */}
            {Object.keys(dailyPayments).length > 0 && (
              <tr className="bg-primary bg-opacity-10">
                <td colSpan="2" className="border border-gray-300 p-2 font-semibold text-primary">Total</td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  {formatUtils.currency(Object.values(dailyPayments).reduce((sum, day) => sum + day.Cash, 0))}
                </td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  {formatUtils.currency(Object.values(dailyPayments).reduce((sum, day) => sum + day.Bank, 0))}
                </td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  {formatUtils.currency(Object.values(dailyPayments).reduce((sum, day) => sum + day.Hudle, 0))}
                </td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  {formatUtils.currency(Object.values(dailyPayments).reduce((sum, day) => sum + day.Cash + day.Bank + day.Hudle, 0))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {Object.keys(dailyPayments).length === 0 && (
        <div className="mt-4 text-center text-gray-500">
          No payment data available for the selected financial year.
        </div>
      )}
    </div>
  );
}

DailyView.propTypes = {
  year: PropTypes.string.isRequired
};

export default DailyView;