import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useErrorTracker } from './useErrorTracker';
import { dataService } from '../services/dataService';
import { filterService } from '../services/filterService';
import { sortService } from '../services/sortService';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

/**
 * Custom hook to manage booking data
 * @returns {Object} Booking data and methods
 */
export const useBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { trackError } = useErrorTracker();
  const { session } = useAuth();
  
  const {
    bookingsData, filteredData, sortField, sortDirection, 
    activeFilters, selectedYear, setBookingsData, 
    setFilteredData, batchUpdate, setIsLoading: setAppLoading
  } = useApp();

  /**
   * Load bookings for selected year
   * @param {string} year - Year to load data for
   * @param {boolean} forceRefresh - Force refresh data
   */
  const loadBookings = useCallback(async (year = selectedYear, forceRefresh = false) => {
    // Use a global loading flag to prevent concurrent requests across rerenders
    if (window.__BOOKINGS_LOADING) {
      console.log('[useBookings] Global loading flag is set, skipping duplicate request');
      return;
    }
    
    // Skip if no session and not in dev mode
    if (!session && !document.body.classList.contains('dev-mode')) {
      console.warn('[useBookings] User not authenticated. Cannot load bookings.');
      return;
    }
    
    // Skip if local state shows loading
    if (isLoading) {
      console.log('[useBookings] Local state shows loading, skipping duplicate request');
      return;
    }
    
    // Check if we're loading for a different year than what's already loaded
    const isYearChange = bookingsData && bookingsData.length > 0 && year !== selectedYear;
    
    // Skip if we already have data for this year and no force refresh requested
    if (!forceRefresh && !isYearChange && bookingsData && bookingsData.length > 0) {
      console.log(`[useBookings] Data already loaded for year ${year}, skipping fetch`);
      return bookingsData;
    }
    
    // Set both local and global loading flags
    window.__BOOKINGS_LOADING = true;
    setIsLoading(true);
    setAppLoading(true);
    setError(null);
    
    try {
      console.log(`[useBookings] Loading bookings for year: ${year}${forceRefresh ? ' (forced refresh)' : ''}`);
      
      const data = await dataService.loadBookings(year, forceRefresh);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data received from server');
      }
      
      console.log(`[useBookings] Loaded ${data.length} bookings for year ${year}`);
      
      // Apply any filters or sorting
      let processedData = [...data];
      
      if (activeFilters?.type && activeFilters?.value) {
        processedData = filterService.applyFilters(
          processedData, 
          activeFilters.type, 
          activeFilters.value
        );
      }
      
      if (sortField) {
        processedData = sortService.sortData(
          processedData,
          sortField,
          sortDirection
        );
      }
      
      // Update state
      batchUpdate({
        bookingsData: data,
        filteredData: processedData,
        currentPage: 1, // Reset to first page
        selectedYear: year
      });
      
      return data;
    } catch (error) {
      console.error('[useBookings] Error loading bookings:', error);
      
      setError(error.message);
      trackError(
        error,
        'useBookings.loadBookings',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
      
      return null;
    } finally {
      // Always clean up loading state flags
      setIsLoading(false);
      setAppLoading(false);
      window.__BOOKINGS_LOADING = false;
    }
  }, [
    selectedYear, 
    session, 
    isLoading, 
    setAppLoading, 
    trackError, 
    bookingsData,
    activeFilters, 
    sortField, 
    sortDirection,
    batchUpdate
  ]);
  
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
  }, [bookingsData, sortField, sortDirection, batchUpdate, trackError]);
  
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
  
  // Auto-load data when selectedYear changes or user logs in
  useEffect(() => {
    if (session || document.body.classList.contains('dev-mode')) {
      loadBookings(selectedYear);
    }
  }, [selectedYear, session, loadBookings]);
  
  return {
    bookingsData,
    filteredData,
    isLoading,
    error,
    loadBookings,
    applyFilter,
    clearFilters,
    applySorting,
    refreshData
  };
}