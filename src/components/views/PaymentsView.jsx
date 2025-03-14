import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { paymentService } from '../../services/paymentService';
import { chartService } from '../../services/chartService';
import { withErrorBoundary } from '../common/ErrorBoundary';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { SummaryStats } from '../summary/SummaryStats';
import ChartComponent from '../charts/ChartComponent';
import PaymentTable from '../table/PaymentTable';

function PaymentsFallback({ error }) {
  return (
    <div className="bg-error-light p-6 rounded-lg border border-error mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-error">Payments View Error</h3>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-white text-error border border-error rounded hover:bg-error hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
      <p className="text-gray-600">{error?.message || 'Error loading payment data'}</p>
    </div>
  );
}

function PaymentsView() {
  const [paymentData, setPaymentData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { filteredData } = useApp();
  const { groupData } = useBookings();
  const { handleAsync, handleError } = useErrorHandler();

  const preparePaymentData = useCallback(async () => {
    if (!filteredData || filteredData.length === 0) {
      setPaymentData(null);
      setChartData(null);
      setIsLoading(false);
      return;
    }

    try {
      await handleAsync(
        async () => {
          console.log('[PaymentsView] Preparing payment data');
          
          // Group data by payment method
          await groupData('payment');
          
          // Process payment data
          const processedData = await paymentService.processPayments(filteredData);
          setPaymentData(processedData);
          
          // Generate chart data
          const chartData = await chartService.generatePaymentCharts(processedData);
          setChartData(chartData);
        },
        'PaymentsView.preparePaymentData',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.DATA,
          metadata: {
            dataLength: filteredData.length
          }
        }
      );
    } catch (error) {
      handleError(
        error,
        'PaymentsView.preparePaymentData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        {
          dataLength: filteredData.length
        }
      );
      setPaymentData(null);
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, groupData, handleAsync, handleError]);

  useEffect(() => {
    setIsLoading(true);
    preparePaymentData();
  }, [preparePaymentData]);

  const handlePaymentAction = useCallback(async (action, paymentId) => {
    try {
      await handleAsync(
        async () => {
          console.log(`[PaymentsView] Processing payment action: ${action} for ID: ${paymentId}`);
          
          // Process payment action
          const result = await paymentService.processPaymentAction(action, paymentId);
          
          if (result.success) {
            // Refresh payment data after successful action
            await preparePaymentData();
          }
        },
        'PaymentsView.handlePaymentAction',
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.PAYMENT,
          metadata: {
            action,
            paymentId
          }
        }
      );
    } catch (error) {
      handleError(
        error,
        'PaymentsView.handlePaymentAction',
        ErrorSeverity.ERROR,
        ErrorCategory.PAYMENT,
        {
          action,
          paymentId
        }
      );
    }
  }, [preparePaymentData, handleAsync, handleError]);

  const handleChartClick = useCallback(async (event, data) => {
    try {
      await handleAsync(
        async () => {
          console.log('[PaymentsView] Chart clicked:', data);
          // Handle chart click event
          // Add your chart click handling logic here
        },
        'PaymentsView.handleChartClick',
        {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.UI,
          metadata: {
            clickedData: data
          }
        }
      );
    } catch (error) {
      handleError(
        error,
        'PaymentsView.handleChartClick',
        ErrorSeverity.WARNING,
        ErrorCategory.UI,
        {
          clickedData: data
        }
      );
    }
  }, [handleAsync, handleError]);

  if (isLoading) {
    return <Loading message="Loading payment data..." />;
  }

  if (!paymentData || !chartData) {
    return (
      <EmptyState
        title="No payment data available"
        message="There are no payments to display for the selected filters."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <SummaryStats customStats={paymentData.summary} />
      
      {/* Payment Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
          <ChartComponent
            data={chartData.methodChart.data}
            type="pie"
            options={chartData.methodChart.options}
            onChartClick={handleChartClick}
          />
        </div>
        
        {/* Payment Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Payment Trends</h2>
          <ChartComponent
            data={chartData.trendChart.data}
            type="line"
            options={chartData.trendChart.options}
            onChartClick={handleChartClick}
          />
        </div>
      </div>
      
      {/* Payment Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
        <PaymentTable
          data={paymentData.transactions}
          onPaymentAction={handlePaymentAction}
        />
      </div>
    </div>
  );
}

// Wrap PaymentsView with error boundary
export default withErrorBoundary(PaymentsView, {
  fallback: PaymentsFallback,
  context: 'PaymentsView',
  metadata: {
    feature: 'payments',
    importance: 'high'
  }
}); 