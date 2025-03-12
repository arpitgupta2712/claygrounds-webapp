import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';

/**
 * TablePagination component for navigating between pages of tabular data
 * @param {Object} props - Component properties
 * @param {number} props.totalItems - Total number of items
 * @param {Function} props.onPageChange - Optional callback when page changes
 * @param {string} props.className - Additional CSS classes
 */
function TablePagination({ totalItems, onPageChange, className = '' }) {
  const { 
    currentPage, 
    rowsPerPage, 
    setCurrentPage 
  } = useApp();

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  
  // Calculate displayed items range
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  
  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log(`[TablePagination] Changing to page ${newPage}`);
      setCurrentPage(newPage);
      
      if (onPageChange) {
        onPageChange(newPage);
      }
      
      // Scroll to top of the table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, setCurrentPage, onPageChange]);

  // Go to previous page
  const goToPreviousPage = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [currentPage, handlePageChange]);

  // Go to next page
  const goToNextPage = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);

  // Don't render pagination if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex justify-center items-center gap-5 my-6 py-5 ${className}`}>
      {/* Previous button */}
      <button
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={`
          px-3 py-2 border border-gray-300 rounded
          flex items-center justify-center min-w-[100px]
          font-medium transition-all duration-200
          ${currentPage === 1 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' 
            : 'hover:border-primary hover:text-primary hover:shadow-sm hover:-translate-y-0.5 text-gray-700 bg-white'}
        `}
      >
        Previous
      </button>

      {/* Page information */}
      <div className="text-text-light font-medium">
        Page {currentPage} of {totalPages}
        <span className="hidden sm:inline ml-2 text-sm">
          ({startIndex + 1}-{endIndex} of {totalItems} items)
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={`
          px-3 py-2 border border-gray-300 rounded
          flex items-center justify-center min-w-[100px]
          font-medium transition-all duration-200
          ${currentPage === totalPages 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' 
            : 'hover:border-primary hover:text-primary hover:shadow-sm hover:-translate-y-0.5 text-gray-700 bg-white'}
        `}
      >
        Next
      </button>
    </div>
  );
}

TablePagination.propTypes = {
  totalItems: PropTypes.number.isRequired,
  onPageChange: PropTypes.func,
  className: PropTypes.string
};

export default TablePagination;