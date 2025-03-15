import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useErrorTracker } from './useErrorTracker';
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
  const { trackError } = useErrorTracker();
  const { session, isInitialized } = useAuth();
  const loadingRef = useRef(false);
  
  const {
    bookingsData, filteredData, sortField, sortDirection, 
    activeFilters, selectedYear, setBookingsData, 
    setFilteredData, batchUpdate, setIsLoading: setAppLoading
  } = useApp();

  /**
   * Group data based on specified parameter
   * @param {string} groupBy - Parameter to group by
   * @param {Array} data - Data to group (optional)
   */
  const groupData = useCallback(async (groupBy, data = filteredData) => {
    if (!data?.length) return;

    try {
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
    } catch (error) {
      trackError(
        error,
        'useBookings.groupData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { groupBy }
      );
    }
  }, [filteredData, trackError]);

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
    
    try {
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
      batchUpdate({
        bookingsData: bookings,
        filteredData: bookings,
        selectedYear: year,
        currentPage: 1,
        error: metadata.isMockData ? {
          type: 'warning',
          message: metadata.errorMessage || 'Using sample data. Some features may be limited.'
        } : null
      });
      
      // Group the data by default categories (only if data changed)
      if (bookings !== bookingsData) {
        await Promise.all([
          groupData('locations', bookings),
          groupData('months', bookings),
          groupData('sports', bookings),
          groupData('status', bookings),
          groupData('source', bookings),
          groupData('payment', bookings)
        ]);
      }
      
    } catch (error) {
      batchUpdate({
        bookingsData: [],
        filteredData: [],
        error: {
          type: 'error',
          message: error.message || 'Failed to load booking data. Please try again.'
        }
      });
      
      trackError(
        error,
        'useBookings.loadBookings',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { year, forceRefresh }
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [bookingsData, selectedYear, batchUpdate, groupData, trackError]);
  
  /**
   * Apply filtering to booking data
   * @param {string} filterType - Type of filter
   * @param {*} filterValue - Filter value
   */
  const applyFilter = useCallback((filterType, filterValue) => {
    if (!bookingsData || bookingsData.length === 0) {
      return;
    }
    
    try {
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
      Promise.all([
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
    } catch (error) {
      setError(error.message);
      trackError(
        error,
        'useBookings.applyFilter',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { filterType, filterValue }
      );
    }
  }, [bookingsData, sortField, sortDirection, batchUpdate, trackError, groupData]);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    try {
      // Apply any sorting to the original data
      const sortedData = sortField 
        ? sortService.sortData(bookingsData, sortField, sortDirection)
        : [...bookingsData];
      
      // Update state
      batchUpdate({
        filteredData: sortedData,
        activeFilters: { type: null, value: null },
        currentPage: 1
      });
    } catch (error) {
      setError(error.message);
      trackError(
        error,
        'useBookings.clearFilters',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [bookingsData, sortField, sortDirection, batchUpdate, trackError]);
  
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
      trackError(
        error,
        'useBookings.applySorting',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { field }
      );
    }
  }, [filteredData, sortField, sortDirection, batchUpdate, trackError]);
  
  /**
   * Refresh booking data
   */
  const refreshData = useCallback(async () => {
    try {
      return await loadBookings(selectedYear, true); // Force refresh
    } catch (error) {
      setError(error.message);
      trackError(
        error,
        'useBookings.refreshData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
      return null;
    }
  }, [loadBookings, selectedYear, trackError]);
  
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