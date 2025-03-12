// src/components/table/TableView.jsx
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import BookingTable from './BookingTable';
import TablePagination from './TablePagination';
import BookingModal from './BookingModal';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import SummaryStats from '../summary/SummaryStats';

/**
 * Main table view component for displaying bookings data
 */
function TableView() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pageData, setPageData] = useState([]);
  
  const { 
    filteredData, currentPage, rowsPerPage, 
    setCurrentPage, isLoading 
  } = useApp();
  
  const { applySorting } = useBookings();
  const { trackError } = useErrorTracker();
  
  // Calculate pagination and set current page data
  useEffect(() => {
    try {
      if (!filteredData || !Array.isArray(filteredData)) {
        console.warn('[TableView] No filtered data available');
        setPageData([]);
        return;
      }
      
      console.log(`[TableView] Calculating pagination for page ${currentPage}`);
      
      // Calculate start and end indices
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      
      // Set current page data
      const paginatedData = filteredData.slice(startIndex, endIndex);
      setPageData(paginatedData);
      
      console.log(`[TableView] Showing ${paginatedData.length} records (${startIndex + 1} to ${Math.min(endIndex, filteredData.length)} of ${filteredData.length})`);
    } catch (error) {
      console.error('[TableView] Error calculating pagination:', error);
      trackError(
        error,
        'TableView.useEffect(pagination)',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
      
      setPageData([]);
    }
  }, [filteredData, currentPage, rowsPerPage, trackError]);
  
  /**
   * Handle row click to show booking details
   * @param {Object} booking - Booking data for the clicked row
   */
  const handleRowClick = (booking) => {
    try {
      console.log('[TableView] Row clicked, showing booking details');
      setSelectedBooking(booking);
      setShowModal(true);
    } catch (error) {
      console.error('[TableView] Error handling row click:', error);
      trackError(
        error,
        'TableView.handleRowClick',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  };
  
  /**
   * Handle header click for sorting
   * @param {string} field - Field to sort by
   */
  const handleHeaderClick = (field) => {
    try {
      console.log(`[TableView] Header clicked for field: ${field}`);
      applySorting(field);
    } catch (error) {
      console.error(`[TableView] Error sorting by ${field}:`, error);
      trackError(
        error,
        'TableView.handleHeaderClick',
        ErrorSeverity.ERROR,
        ErrorCategory.UI,
        { field }
      );
    }
  };
  
  /**
   * Handle pagination change
   * @param {number} page - New page number
   */
  const handlePageChange = (page) => {
    try {
      console.log(`[TableView] Changing to page ${page}`);
      setCurrentPage(page);
      
      // Scroll to top of table
      window.scrollTo({
        top: document.querySelector('.table-container')?.offsetTop - 100 || 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error(`[TableView] Error changing page to ${page}:`, error);
      trackError(
        error,
        'TableView.handlePageChange',
        ErrorSeverity.ERROR,
        ErrorCategory.UI,
        { page }
      );
    }
  };
  
  /**
   * Close the booking detail modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Summary Statistics */}
      <SummaryStats data={filteredData} />
      
      {/* Loading State */}
      {isLoading && (
        <Loading message="Loading booking data..." />
      )}
      
      {/* Empty State */}
      {!isLoading && (!pageData || pageData.length === 0) && (
        <EmptyState.Filter
          action={
            filteredData && filteredData.length > 0 ? (
              <div className="text-sm text-gray-500">
                Try changing page or adjusting filters
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No booking data available
              </div>
            )
          }
        />
      )}
      
      {/* Table Content */}
      {!isLoading && pageData && pageData.length > 0 && (
        <div className="table-wrapper">
          {/* Pagination (top) */}
          {filteredData && filteredData.length > rowsPerPage && (
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
            />
          )}
          
          {/* Table */}
          <div className="table-container mt-4 overflow-x-auto shadow-sm border border-gray-200 rounded-md">
            <BookingTable
              data={pageData}
              onRowClick={handleRowClick}
              onHeaderClick={handleHeaderClick}
            />
          </div>
          
          {/* Pagination (bottom) */}
          {filteredData && filteredData.length > rowsPerPage && (
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              className="mt-4"
            />
          )}
        </div>
      )}
      
      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default TableView;