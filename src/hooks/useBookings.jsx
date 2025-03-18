import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useErrorHandler } from './useErrorHandler';
import { dataService } from '../services/dataService';
import { filterService } from '../services/filterService';
import { sortService } from '../services/sortService';
import { groupingService } from '../services/groupingService';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

/**
 * Custom hook to manage booking data
 * @returns {Object} Booking data and methods
 */
export const useBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const { handleAsync, handleError } = useErrorHandler();
  const { session, isInitialized } = useAuth();
  const loadingRef = useRef(false);
  
  const {
    bookingsData, filteredData, sortField, sortDirection, 
    activeFilters, selectedYear, setBookingsData, 
    setFilteredData, batchUpdate, setIsLoading: setAppLoading,
    setActiveFilters
  } = useApp();

  /**
   * Group data based on specified parameter
   * @param {string} groupBy - Parameter to group by
   * @param {Array} data - Data to group (optional)
   */
  const groupData = useCallback(async (groupBy, data = filteredData) => {
    if (!data?.length) return;

    return handleAsync(
      async () => {
        let grouped;
        // Normalize groupBy to handle both singular and plural forms
        // But with special handling for terms like 'status' that shouldn't be modified
        let normalizedGroupBy = groupBy;
        
        // Special cases that shouldn't be normalized
        const specialCases = ['status'];
        
        if (!specialCases.includes(groupBy)) {
          normalizedGroupBy = groupBy.replace(/s$/, '');
        }
        
        // Use memoized grouping functions
        switch (normalizedGroupBy) {
          case 'date':
            grouped = await groupingService.groupByDate(data, 'day');
            break;
          case 'month':
            grouped = await groupingService.groupByDate(data, 'month');
            break;
          case 'year':
            grouped = await groupingService.groupByDate(data, 'year');
            break;
          case 'location':
            grouped = await groupingService.groupByLocation(data);
            break;
          case 'source':
            grouped = await groupingService.groupBySource(data);
            break;
          case 'sport':
            grouped = await groupingService.groupBySport(data);
            break;
          case 'status':
            grouped = await groupingService.groupByStatus(data);
            break;
          case 'payment':
            grouped = await groupingService.groupByPaymentMode(data);
            break;
          default:
            return;
        }
        
        // Store the result using the original groupBy parameter
        setGroupedData(prev => ({
          ...prev,
          [groupBy]: grouped
        }));

        return grouped;
      },
      'useBookings.groupData',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          groupBy,
          dataLength: data?.length,
          normalizedGroupBy: groupBy.replace(/s$/, '')
        }
      }
    );
  }, [filteredData, handleAsync]);

  /**
   * Load bookings for selected year
   * @param {string} year - Year to load data for
   * @param {boolean} forceRefresh - Force refresh data
   */
  const loadBookings = useCallback(async (year, forceRefresh = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.debug('[useBookings] Already loading, skipping...');
      return;
    }

    // Skip if we already have data and no force refresh
    if (!forceRefresh && bookingsData?.length > 0 && year === selectedYear) {
      console.debug('[useBookings] Using existing data for year:', year);
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    await handleAsync(
      async () => {
        const result = await dataService.loadBookings(year, forceRefresh);
        
        // Validate the response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid data structure received from server');
        }
        
        // Extract bookings array and metadata
        const { bookings = [], metadata = {} } = result;
        
        // Ensure bookings is an array
        if (!Array.isArray(bookings)) {
          throw new Error('Invalid bookings data format');
        }
        
        // Update state with the validated data
        const sortedBookings = sortService.sortData(bookings, 'S no', 'asc');
        batchUpdate({
          bookingsData: sortedBookings,
          filteredData: sortedBookings,
          selectedYear: year,
          currentPage: 1,
          error: metadata.isMockData ? {
            type: 'warning',
            message: metadata.errorMessage || 'Using sample data. Some features may be limited.'
          } : null
        });
        
        // Group the data by default categories (only if data changed)
        if (sortedBookings !== bookingsData) {
          await Promise.all([
            groupData('locations', sortedBookings),
            groupData('months', sortedBookings),
            groupData('sports', sortedBookings),
            groupData('status', sortedBookings),
            groupData('source', sortedBookings),
            groupData('payment', sortedBookings)
          ]);
        }
      },
      'useBookings.loadBookings',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          year,
          forceRefresh,
          hasExistingData: bookingsData?.length > 0,
          isCurrentYear: year === selectedYear
        },
        onError: (error) => {
          batchUpdate({
            bookingsData: [],
            filteredData: [],
            error: {
              type: 'error',
              message: error.message || 'Failed to load booking data. Please try again.'
            }
          });
        }
      }
    ).finally(() => {
      loadingRef.current = false;
      setIsLoading(false);
    });
  }, [bookingsData, selectedYear, batchUpdate, groupData, handleAsync]);
  
  /**
   * Apply filtering to booking data
   * @param {string} filterType - Type of filter
   * @param {*} filterValue - Filter value
   */
  const applyFilter = useCallback((filterType, filterValue) => {
    if (!bookingsData || bookingsData.length === 0) {
      return;
    }
    
    handleAsync(
      async () => {
        // Apply the filter
        const newFilteredData = filterService.applyFilters(
          bookingsData,
          filterType,
          filterValue
        );
        
        // Apply any current sorting
        const sortedData = sortField 
          ? sortService.sortData(newFilteredData, sortField, sortDirection)
          : newFilteredData;
        
        // Group the filtered data asynchronously
        await Promise.all([
          groupData('locations', sortedData),
          groupData('months', sortedData),
          groupData('sports', sortedData),
          groupData('status', sortedData),
          groupData('source', sortedData),
          groupData('payment', sortedData)
        ]);
        
        // Update state
        batchUpdate({
          filteredData: sortedData,
          activeFilters: { type: filterType, value: filterValue },
          currentPage: 1
        });
      },
      'useBookings.applyFilter',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          filterType,
          filterValue,
          dataLength: bookingsData?.length,
          hasSorting: !!sortField
        },
        onError: (error) => {
          setError(error.message);
        }
      }
    );
  }, [bookingsData, sortField, sortDirection, batchUpdate, handleAsync, groupData]);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    handleAsync(
      async () => {
        console.debug('[useBookings] Clearing all filters');
        
        // Update app context to reset filters
        setActiveFilters({ type: null, value: null });
        
        // Important: Clear the filter cache to prevent stale results
        filterService.clearCache();
        
        // Reset to the original data
        setFilteredData(bookingsData);
        
        // Log the number of records after clearing filters
        console.debug(`[useBookings] Filters cleared, showing all ${bookingsData?.length || 0} records`);
      },
      'useBookings.clearFilters',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          hasFilters: !!activeFilters?.type || !!activeFilters?.value,
          dataLength: bookingsData?.length
        }
      }
    );
  }, [setActiveFilters, bookingsData, handleAsync]);
  
  /**
   * Apply sorting to booking data
   * @param {string} field - Field to sort by
   */
  const applySorting = useCallback((field) => {
    if (!filteredData || filteredData.length === 0) {
      return;
    }
    
    try {
      // Determine the next sort direction
      const nextDirection = sortService.getNextSortDirection(
        sortField,
        field,
        sortDirection
      );
      
      // Sort the data
      const sortedData = sortService.sortData(
        filteredData,
        field,
        nextDirection
      );
      
      // Update state
      batchUpdate({
        filteredData: sortedData,
        sortField: field,
        sortDirection: nextDirection
      });
    } catch (error) {
      setError(error.message);
      handleError(
        error,
        'useBookings.applySorting',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { field }
      );
    }
  }, [filteredData, sortField, sortDirection, batchUpdate, handleError]);
  
  /**
   * Refresh booking data
   */
  const refreshData = useCallback(async () => {
    try {
      return await loadBookings(selectedYear, true); // Force refresh
    } catch (error) {
      setError(error.message);
      handleError(
        error,
        'useBookings.refreshData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
      return null;
    }
  }, [loadBookings, selectedYear, handleError]);
  
  // Memoize the filtered data to prevent unnecessary recalculations
  const memoizedFilteredData = useMemo(() => {
    if (!bookingsData || !activeFilters?.type) return bookingsData;
    return filterService.applyFilters(bookingsData, activeFilters.type, activeFilters.value);
  }, [bookingsData, activeFilters]);

  // Auto-load data when selectedYear changes or user logs in
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const loadData = async () => {
      if (!mounted || !selectedYear || loadingRef.current) return;
      
      // Add a small delay to prevent rapid consecutive loads
      timeoutId = setTimeout(async () => {
        if (mounted && (session || document.body.classList.contains('dev-mode')) && isInitialized) {
          await loadBookings(selectedYear);
        }
      }, 100);
    };

    loadData();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedYear, session, isInitialized, loadBookings]);
  
  return {
    bookingsData,
    filteredData: memoizedFilteredData,
    groupedData,
    isLoading,
    error,
    loadBookings,
    applyFilter,
    clearFilters,
    applySorting,
    refreshData,
    groupData
  };
};