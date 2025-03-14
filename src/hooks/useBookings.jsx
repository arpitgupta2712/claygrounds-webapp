import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const groupData = useCallback((groupBy, data = filteredData) => {
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
      
      console.log(`[useBookings] Grouping data by: ${normalizedGroupBy} (original: ${groupBy})`);
      
      switch (normalizedGroupBy) {
        case 'date':
          grouped = groupingService.groupByDate(data, 'day');
          break;
        case 'month':
          grouped = groupingService.groupByDate(data, 'month');
          break;
        case 'year':
          grouped = groupingService.groupByDate(data, 'year');
          break;
        case 'location':
          grouped = groupingService.groupByLocation(data);
          break;
        case 'source':
          grouped = groupingService.groupBySource(data);
          break;
        case 'sport':
          grouped = groupingService.groupBySport(data);
          break;
        case 'status':
          grouped = groupingService.groupByStatus(data);
          break;
        case 'payment':
          grouped = groupingService.groupByPaymentMode(data);
          break;
        default:
          console.warn(`[useBookings] Unknown grouping parameter: ${groupBy}`);
          return;
      }
      
      // Store the result using the original groupBy parameter
      // This ensures we don't overwrite previously grouped data for other types
      setGroupedData(prev => ({
        ...prev,
        [groupBy]: grouped
      }));
    } catch (error) {
      console.error('[useBookings] Error grouping data:', error);
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
    // Skip if already loading
    if (isLoading) {
      console.log('[useBookings] Already loading data, skipping request');
      return;
    }

    // Skip if we already have data and no force refresh
    if (!forceRefresh && bookingsData?.length > 0 && year === selectedYear) {
      console.log('[useBookings] Data already loaded for year', year);
      return;
    }
    
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
      
      console.log(`[useBookings] Loaded ${bookings.length} bookings for year ${year}`);
      
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
        console.log('[useBookings] Data changed, updating groups');
        groupData('locations', bookings);
        groupData('months', bookings);
        groupData('sports', bookings);
        groupData('status', bookings);
        groupData('source', bookings);
        groupData('payment', bookings);
      }
      
    } catch (error) {
      console.error('[useBookings] Error loading bookings:', error);
      batchUpdate({
        bookingsData: [],
        filteredData: [],
        error: {
          type: 'error',
          message: error.message || 'Failed to load booking data. Please try again.'
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, bookingsData, selectedYear, batchUpdate, groupData]);
  
  /**
   * Apply filtering to booking data
   * @param {string} filterType - Type of filter
   * @param {*} filterValue - Filter value
   */
  const applyFilter = useCallback((filterType, filterValue) => {
    if (!bookingsData || bookingsData.length === 0) {
      console.warn('[useBookings] No data available to filter');
      return;
    }
    
    try {
      console.log(`[useBookings] Applying filter: ${filterType}`, filterValue);
      
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
      
      // Group the filtered data
      console.log('[useBookings] Regrouping data after applying filter');
      groupData('locations', sortedData);
      groupData('months', sortedData);
      groupData('sports', sortedData);
      groupData('status', sortedData);
      groupData('source', sortedData);
      groupData('payment', sortedData);
      
      // Update state
      batchUpdate({
        filteredData: sortedData,
        activeFilters: { type: filterType, value: filterValue },
        currentPage: 1 // Reset to first page
      });
    } catch (error) {
      console.error('[useBookings] Error applying filter:', error);
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
      console.log('[useBookings] Clearing filters');
      
      // Apply any sorting to the original data
      const sortedData = sortField 
        ? sortService.sortData(bookingsData, sortField, sortDirection)
        : [...bookingsData];
      
      // Update state
      batchUpdate({
        filteredData: sortedData,
        activeFilters: { type: null, value: null },
        currentPage: 1 // Reset to first page
      });
    } catch (error) {
      console.error('[useBookings] Error clearing filters:', error);
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
      console.warn('[useBookings] No data available to sort');
      return;
    }
    
    try {
      console.log(`[useBookings] Applying sorting on field: ${field}`);
      
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
      console.error('[useBookings] Error applying sorting:', error);
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
      console.log('[useBookings] Refreshing booking data');
      return await loadBookings(selectedYear, true); // Force refresh
    } catch (error) {
      console.error('[useBookings] Error refreshing data:', error);
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
    if ((session || document.body.classList.contains('dev-mode')) && isInitialized && selectedYear) {
      // Add a small delay to prevent rapid consecutive loads
      const timeoutId = setTimeout(() => {
        loadBookings(selectedYear);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedYear, session, isInitialized, loadBookings]);
  
  return {
    bookingsData,
    filteredData,
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
}