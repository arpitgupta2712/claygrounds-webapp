import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { statsService } from '../../services/statsService';
import { formatUtils } from '../../utils/formatUtils';
import Loading from '../common/Loading';
import ReportCard from './ReportCard';
import ReportTable from './ReportTable';
import ReportChart from './ReportChart';

/**
 * GlobalReport component for displaying comprehensive booking reports across all locations
 * Provides summary, monthly, and location-based analysis views
 */
function GlobalReport() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('summary'); // summary, monthly, location
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { handleAsync } = useErrorHandler();

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setReportData(null);
      return;
    }

    setIsLoading(true);
    
    handleAsync(
      async () => {
        console.log('[GlobalReport] Generating report data');
        
        // Ensure we have all required groupings
        await Promise.all([
          groupData('month'),
          groupData('location'),
          groupData('status'),
          groupData('payment'),
          groupData('source')
        ]);
        
        // Calculate summary statistics
        const summaryStats = await statsService.calculateSummaryStats(filteredData);
        
        // Calculate monthly payment statistics
        const monthlyPayments = await statsService.calculateMonthlyPayments(filteredData);
        
        // Get location distribution
        const locationStats = summaryStats.locationStats;
        
        setReportData({
          summary: summaryStats,
          monthly: monthlyPayments,
          location: locationStats
        });
      },
      'GlobalReport.generateReport',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          dataLength: filteredData.length,
          activeView
        }
      }
    ).finally(() => setIsLoading(false));
  }, [filteredData, groupData, handleAsync, activeView]);

  if (isLoading) {
    return <Loading size="sm" message="Generating report..." className="my-6" />;
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* View selector */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveView('summary')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'summary' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveView('monthly')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'monthly' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Monthly Analysis
        </button>
        <button
          onClick={() => setActiveView('location')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'location' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Location Analysis
        </button>
      </div>

      {/* Summary View */}
      {activeView === 'summary' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title="Total Revenue"
              value={reportData.summary.totalCollection}
              type="currency"
              trend={10} // Calculate trend
            />
            <ReportCard
              title="Total Bookings"
              value={reportData.summary.totalBookings}
              type="number"
              trend={5} // Calculate trend
            />
            <ReportCard
              title="Unique Customers"
              value={reportData.summary.uniqueCustomers}
              type="number"
              trend={15} // Calculate trend
            />
            <ReportCard
              title="Avg. Revenue/Slot"
              value={reportData.summary.avgRevenuePerSlot}
              type="currency"
              trend={-2} // Calculate trend
            />
          </div>

          {/* Payment Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Payment Distribution</h3>
            <ReportChart
              data={[
                {
                  label: 'Cash',
                  value: reportData.summary.paymentStats.cash.amount,
                  percentage: reportData.summary.paymentStats.cash.percentage
                },
                {
                  label: 'Bank',
                  value: reportData.summary.paymentStats.bank.amount,
                  percentage: reportData.summary.paymentStats.bank.percentage
                },
                {
                  label: 'Hudle',
                  value: reportData.summary.paymentStats.hudle.amount,
                  percentage: reportData.summary.paymentStats.hudle.percentage
                }
              ]}
              type="pie"
            />
          </div>

          {/* Booking Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
            <ReportChart
              data={[
                {
                  label: 'Confirmed',
                  value: reportData.summary.statusStats.confirmed,
                  percentage: reportData.summary.statusStats.confirmationRate
                },
                {
                  label: 'Cancelled',
                  value: reportData.summary.statusStats.cancelled,
                  percentage: (reportData.summary.statusStats.cancelled / reportData.summary.totalBookings) * 100
                },
                {
                  label: 'Partially Cancelled',
                  value: reportData.summary.statusStats.partially_cancelled,
                  percentage: (reportData.summary.statusStats.partially_cancelled / reportData.summary.totalBookings) * 100
                }
              ]}
              type="bar"
            />
          </div>
        </div>
      )}

      {/* Monthly Analysis View */}
      {activeView === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Revenue Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
            <ReportChart
              data={reportData.monthly.map(month => ({
                label: month.month,
                value: month.totalAmount,
                details: {
                  cash: month.cashAmount,
                  bank: month.bankAmount,
                  hudle: month.hudleAmount
                }
              }))}
              type="line"
            />
          </div>

          {/* Monthly Details Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Monthly Details</h3>
            <ReportTable
              data={reportData.monthly}
              columns={[
                { key: 'month', label: 'Month' },
                { key: 'totalAmount', label: 'Total Revenue', format: 'currency' },
                { key: 'cashAmount', label: 'Cash', format: 'currency' },
                { key: 'bankAmount', label: 'Bank', format: 'currency' },
                { key: 'hudleAmount', label: 'Hudle', format: 'currency' }
              ]}
            />
          </div>
        </div>
      )}

      {/* Location Analysis View */}
      {activeView === 'location' && (
        <div className="space-y-6">
          {/* Location Revenue Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Location Revenue Distribution</h3>
            <ReportChart
              data={reportData.location.map(loc => ({
                label: loc.locationId,
                value: loc.revenue,
                details: {
                  bookings: loc.bookings,
                  slots: loc.slots,
                  customers: loc.uniqueCustomers
                }
              }))}
              type="bar"
            />
          </div>

          {/* Location Details Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Location Details</h3>
            <ReportTable
              data={reportData.location}
              columns={[
                { key: 'locationId', label: 'Location' },
                { key: 'bookings', label: 'Total Bookings', format: 'number' },
                { key: 'revenue', label: 'Revenue', format: 'currency' },
                { key: 'slots', label: 'Total Slots', format: 'number' },
                { key: 'uniqueCustomers', label: 'Unique Customers', format: 'number' }
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalReport; 