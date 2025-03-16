import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ViewTypes } from '../../utils/constants';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { ErrorDisplay } from '../../context/ErrorContext';
import { ToastContainer } from '../../hooks/useToast';
import { dataService } from '../../services/dataService';
import ScrollToTop from '../common/ScrollToTop';
import locations from '../../locations.json';
import LocationReport from '../reports/LocationReport';
import { withErrorBoundary } from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';
import ErrorDashboard from '../error/ErrorDashboard';

// Components
import Header from './Header';
import Navigation from './Navigation';
import FilterControls from './FilterControls';
import TableView from '../table/TableView';
import CategoryView from '../category/CategoryView';
import PaymentsView from '../payments/PaymentsView';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

/**
 * Location Report component wrapper that gets location ID from URL params
 */
function LocationReportWrapper() {
  const { facilityId } = useParams();
  const location = locations.find(loc => loc.Location_id === facilityId);
  
  if (!location) {
    return (
      <EmptyState
        title="Location Not Found"
        message="The location you're looking for doesn't exist."
        icon="error"
      />
    );
  }
  
  return <LocationReport locationId={location.Location_id} locationName={location.Location_name} />;
}

function DashboardFallback({ error }) {
  return (
    <div className="min-h-screen p-6 bg-background-light">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 border-l-4 border-error">
        <h2 className="text-2xl font-semibold text-error mb-4">Dashboard Error</h2>
        <p className="text-gray-600 mb-4">
          We encountered an error while loading the dashboard. Our team has been notified.
        </p>
        <div className="bg-error-light rounded p-4 mb-6">
          <p className="text-error font-mono text-sm">{error?.message || 'Unknown error occurred'}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Reload Dashboard
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Main dashboard component
 */
function Dashboard() {
  // Strict one-time initialization flag - global to prevent module reloads resetting it
  if (typeof window.__DASHBOARD_INITIALIZED === 'undefined') {
    window.__DASHBOARD_INITIALIZED = false;
  }
  
  const { isLoading, bookingsData, setCurrentView, currentView, selectedYear } = useApp();
  const { loadBookings } = useBookings();
  const { handleAsync, handleError } = useErrorHandler();
  const { session, isInitialized } = useAuth();
  const location = useLocation();
  const prevYearRef = useRef(selectedYear);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Load initial data only once - globally
  useEffect(() => {
    const initializeDashboard = async () => {
      // Only run once per app lifetime and after auth is initialized
      if (!window.__DASHBOARD_INITIALIZED && isInitialized) {
        logger.info(ErrorCategory.UI, 'Initializing dashboard');
        
        try {
          // Set global flag before async operations to prevent race conditions
          window.__DASHBOARD_INITIALIZED = true;
          
          await handleAsync(
            async () => {
              await loadBookings(selectedYear);
            },
            'Dashboard.initialization',
            {
              severity: ErrorSeverity.CRITICAL,
              category: ErrorCategory.DATA,
              metadata: {
                operation: 'initialLoad',
                year: selectedYear,
                hasSession: !!session
              }
            }
          );
          
          logger.info(ErrorCategory.UI, 'Dashboard initialization complete');
        } catch (error) {
          logger.error(ErrorCategory.UI, 'Dashboard initialization failed', error);
          handleError(
            error,
            'Dashboard.initialization',
            ErrorSeverity.CRITICAL,
            ErrorCategory.DATA,
            {
              operation: 'initialLoad',
              year: selectedYear,
              hasSession: !!session
            }
          );
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    
    // Only initialize if auth is ready
    if (isInitialized) {
      initializeDashboard();
    }
  }, [isInitialized, session, selectedYear, loadBookings, handleAsync, handleError]);
  
  // React to year changes - reload data ONLY when year actually changes
  useEffect(() => {
    // Only proceed if initialization complete and year has actually changed
    if (window.__DASHBOARD_INITIALIZED && selectedYear !== prevYearRef.current && isInitialized) {
      logger.info(ErrorCategory.DATA, `Selected year changed: ${prevYearRef.current} -> ${selectedYear}`);
      
      const reloadData = async () => {
        try {
          // Clear any existing data cache
          dataService.clearCache();
          
          // Force reload of data for the new year
          await handleAsync(
            async () => {
              await loadBookings(selectedYear, true);
            },
            'Dashboard.yearChange',
            {
              severity: ErrorSeverity.ERROR,
              category: ErrorCategory.DATA,
              metadata: {
                operation: 'yearChange',
                previousYear: prevYearRef.current,
                newYear: selectedYear,
                hasSession: !!session
              }
            }
          );
          
          // Update the ref to the new year
          prevYearRef.current = selectedYear;
        } catch (error) {
          logger.error(ErrorCategory.DATA, 'Failed to load data for new year', {
            error,
            previousYear: prevYearRef.current,
            newYear: selectedYear
          });
          handleError(
            error,
            'Dashboard.yearChange',
            ErrorSeverity.ERROR,
            ErrorCategory.DATA,
            {
              operation: 'yearChange',
              previousYear: prevYearRef.current,
              newYear: selectedYear,
              hasSession: !!session
            }
          );
        }
      };

      reloadData();
    }
  }, [selectedYear, loadBookings, handleAsync, handleError, isInitialized, session]);

  // Show loading state during initialization
  if (isInitializing || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isInitialized ? 'Initializing dashboard...' : 'Initializing authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  if (!session && !document.body.classList.contains('dev-mode')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access the dashboard.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Error display positioned absolute */}
      <ErrorDisplay />
      
      {/* Toast notifications */}
      <ToastContainer />
      
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <main className="flex-grow p-4 md:p-6 lg:p-10 w-full">
        <div className="mx-auto w-[90%] bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-10">
          {/* Navigation */}
          <Navigation />
          
          {/* Filter Controls */}
          <FilterControls />
          
          {/* Main View */}
          {isLoading ? (
            <Loading message="Loading booking data..." />
          ) : bookingsData && bookingsData.length > 0 ? (
            <Routes>
              <Route path="table" element={<TableView />} />
              <Route path="locations" element={<CategoryView type="locations" />} />
              <Route path="months" element={<CategoryView type="months" />} />
              <Route path="sports" element={<CategoryView type="sports" />} />
              <Route path="status" element={<CategoryView type="status" />} />
              <Route path="source" element={<CategoryView type="source" />} />
              <Route path="payments" element={<PaymentsView />} />
              <Route path="errors" element={<ErrorDashboard />} />
              <Route path="reports/:facilityId" element={<LocationReportWrapper />} />
              <Route index element={<Navigate to="table" replace />} />
              <Route path="*" element={
                <EmptyState 
                  title="Page Not Found" 
                  message="The page you are looking for does not exist."
                  icon="error"
                />
              } />
            </Routes>
          ) : (
            <EmptyState 
              title="No Bookings Found" 
              message="There are no bookings available for the selected filters." 
            />
          )}
        </div>
      </main>
      
      {/* Scroll to top button */}
      <ScrollToTop />
      
      {/* Footer */}
      <footer className="py-4 px-6 text-center text-gray-500 text-sm">
        <p>ClayGrounds by Plaza &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

// Wrap Dashboard with error boundary
export default withErrorBoundary(Dashboard, {
  fallback: DashboardFallback,
  context: 'Dashboard',
  metadata: {
    feature: 'dashboard',
    importance: 'critical'
  }
});