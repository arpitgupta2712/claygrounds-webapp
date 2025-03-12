import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { ViewTypes } from '../../utils/constants';
import { ErrorDisplay } from '../../hooks/useErrorTracker';
import { ToastContainer } from '../../hooks/useToast';
import { dataService } from '../../services/dataService';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import ScrollToTop from '../common/ScrollToTop';
import locations from '../../locations.json';

// Components
import Header from './Header';
import Navigation from './Navigation';
import FilterControls from './FilterControls';
import TableView from '../table/TableView';
import CategoryView from '../category/CategoryView';
import ReportView from '../report/ReportView';
import PaymentsView from '../payments/PaymentsView';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

/**
 * Location Report component wrapper that gets location ID from URL params
 */
function FacilityReport() {
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
  
  return <ReportView facilityId={location.Location_id} facilityName={location.Location_name} />;
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
  const location = useLocation();
  const prevYearRef = useRef(selectedYear);

  // Load initial data only once - globally
  useEffect(() => {
    const initializeDashboard = async () => {
      // Only run once per app lifetime
      if (!window.__DASHBOARD_INITIALIZED) {
        console.log('[Dashboard] Initializing dashboard and loading data');
        try {
          // Set global flag before async operations to prevent race conditions
          window.__DASHBOARD_INITIALIZED = true;
          await loadBookings();
          console.log('[Dashboard] Initialization complete');
        } catch (error) {
          console.error('[Dashboard] Error during initialization:', error);
        }
      }
    };
    
    // Immediate invocation with no dependencies
    initializeDashboard();
  }, []); // Empty dependency array - only run once
  
  // React to year changes - reload data ONLY when year actually changes
  useEffect(() => {
    // Only proceed if initialization complete and year has actually changed
    if (window.__DASHBOARD_INITIALIZED && selectedYear !== prevYearRef.current) {
      console.log(`[Dashboard] Selected year changed from ${prevYearRef.current} to: ${selectedYear}, reloading data`);
      
      // Clear any existing data cache
      dataService.clearCache();
      
      // Force reload of data for the new year
      loadBookings(selectedYear, true);
      
      // Update the ref to the new year
      prevYearRef.current = selectedYear;
    }
  }, [selectedYear, loadBookings]);
  
  // Handle view changes from routes - completely separated from initialization
  const handleViewChange = (view) => {
    // Only update if the view is different from current and valid
    if (view && typeof view === 'string' && view !== currentView) {
      console.log(`[Dashboard] Changing view to: ${view}`);
      setCurrentView(view);
    }
  };

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
          <Navigation onViewChange={handleViewChange} />
          
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
              <Route path="reports/:facilityId" element={<FacilityReport />} />
              <Route path="*" element={<Navigate to="table" replace />} />
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

export default Dashboard;