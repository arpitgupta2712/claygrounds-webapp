import { createContext, useState, useContext, useReducer, useCallback, useEffect } from 'react';
import { useErrorTracker } from '../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';
import { CONSTANTS, ViewTypes, FilterTypes } from '../utils/constants';
import { statsService } from '../services/statsService';

// Initial state mirroring the original store.js state
const initialState = {
  // Data State
  bookingsData: [],
  filteredData: [],
  
  // UI State
  currentPage: 1,
  currentView: ViewTypes.TABLE,
  rowsPerPage: 50,
  isLoading: false,
  
  // Filter/Sort State
  selectedYear: '202425',
  activeFilters: {
    type: null,
    value: null,
  },
  currentCategoryType: null,
  selectedCategory: null,
  sortField: null,
  sortDirection: 'desc',
};

// Action types
const ActionTypes = {
  SET_BOOKINGS_DATA: 'SET_BOOKINGS_DATA',
  SET_FILTERED_DATA: 'SET_FILTERED_DATA',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_ROWS_PER_PAGE: 'SET_ROWS_PER_PAGE',
  SET_LOADING: 'SET_LOADING',
  SET_SELECTED_YEAR: 'SET_SELECTED_YEAR',
  SET_ACTIVE_FILTERS: 'SET_ACTIVE_FILTERS',
  SET_CATEGORY_TYPE: 'SET_CATEGORY_TYPE',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_SORT: 'SET_SORT',
  BATCH_UPDATE: 'BATCH_UPDATE',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_BOOKINGS_DATA:
      return { ...state, bookingsData: action.payload };
    
    case ActionTypes.SET_FILTERED_DATA:
      return { ...state, filteredData: action.payload };
    
    case ActionTypes.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
    
    case ActionTypes.SET_CURRENT_VIEW:
      return { ...state, currentView: action.payload };
    
    case ActionTypes.SET_ROWS_PER_PAGE:
      return { ...state, rowsPerPage: action.payload };
    
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_SELECTED_YEAR:
      return { ...state, selectedYear: action.payload };
    
    case ActionTypes.SET_ACTIVE_FILTERS:
      return { ...state, activeFilters: action.payload };
    
    case ActionTypes.SET_CATEGORY_TYPE:
      return { ...state, currentCategoryType: action.payload };
    
    case ActionTypes.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload };
    
    case ActionTypes.SET_SORT:
      return { 
        ...state, 
        sortField: action.payload.field,
        sortDirection: action.payload.direction
      };
    
    case ActionTypes.BATCH_UPDATE:
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

// Create the context
const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { trackError } = useErrorTracker();
  
  // Action creators with error tracking
  const setBookingsData = useCallback((data) => {
    try {
      console.log('[AppContext] Setting bookings data, length:', data?.length);
      dispatch({ type: ActionTypes.SET_BOOKINGS_DATA, payload: data });
    } catch (error) {
      console.error('[AppContext] Error setting bookings data:', error);
      trackError(
        error,
        'AppContext.setBookingsData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [trackError]);
  
  const setFilteredData = useCallback((data) => {
    try {
      console.log('[AppContext] Setting filtered data, length:', data?.length);
      dispatch({ type: ActionTypes.SET_FILTERED_DATA, payload: data });
    } catch (error) {
      console.error('[AppContext] Error setting filtered data:', error);
      trackError(
        error,
        'AppContext.setFilteredData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [trackError]);
  
  const setCurrentPage = useCallback((page) => {
    try {
      console.log('[AppContext] Setting current page:', page);
      dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: page });
    } catch (error) {
      console.error('[AppContext] Error setting current page:', error);
      trackError(
        error,
        'AppContext.setCurrentPage',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const setCurrentView = useCallback((view) => {
    try {
      console.log('[AppContext] Setting current view:', view);
      dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    } catch (error) {
      console.error('[AppContext] Error setting current view:', error);
      trackError(
        error,
        'AppContext.setCurrentView',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const setIsLoading = useCallback((isLoading) => {
    try {
      console.log('[AppContext] Setting loading state:', isLoading);
      dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
    } catch (error) {
      console.error('[AppContext] Error setting loading state:', error);
      trackError(
        error,
        'AppContext.setIsLoading',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const setSelectedYear = useCallback((year) => {
    try {
      // Only proceed if the year is actually different
      if (year !== state.selectedYear) {
        console.log('[AppContext] Setting selected year:', year);
        
        // Clear stats cache for the previous year
        if (state.selectedYear) {
          statsService.clearCacheForYear(state.selectedYear);
        }
        
        dispatch({ type: ActionTypes.SET_SELECTED_YEAR, payload: year });
      } else {
        console.log('[AppContext] Year unchanged, skipping update:', year);
      }
    } catch (error) {
      console.error('[AppContext] Error setting selected year:', error);
      trackError(
        error,
        'AppContext.setSelectedYear',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError, state.selectedYear]);
  
  const setActiveFilters = useCallback((filters) => {
    try {
      console.log('[AppContext] Setting active filters:', filters);
      dispatch({ type: ActionTypes.SET_ACTIVE_FILTERS, payload: filters });
    } catch (error) {
      console.error('[AppContext] Error setting active filters:', error);
      trackError(
        error,
        'AppContext.setActiveFilters',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [trackError]);
  
  const setCategoryType = useCallback((categoryType) => {
    try {
      console.log('[AppContext] Setting category type:', categoryType);
      dispatch({ type: ActionTypes.SET_CATEGORY_TYPE, payload: categoryType });
    } catch (error) {
      console.error('[AppContext] Error setting category type:', error);
      trackError(
        error,
        'AppContext.setCategoryType',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const setSelectedCategory = useCallback((category) => {
    try {
      console.log('[AppContext] Setting selected category:', category);
      dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: category });
    } catch (error) {
      console.error('[AppContext] Error setting selected category:', error);
      trackError(
        error,
        'AppContext.setSelectedCategory',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const setSort = useCallback((field, direction) => {
    try {
      console.log(`[AppContext] Setting sort: ${field} ${direction}`);
      dispatch({ 
        type: ActionTypes.SET_SORT, 
        payload: { field, direction } 
      });
    } catch (error) {
      console.error('[AppContext] Error setting sort:', error);
      trackError(
        error,
        'AppContext.setSort',
        ErrorSeverity.ERROR,
        ErrorCategory.UI
      );
    }
  }, [trackError]);
  
  const batchUpdate = useCallback((updates) => {
    try {
      console.log('[AppContext] Batch updating state:', Object.keys(updates));
      dispatch({ type: ActionTypes.BATCH_UPDATE, payload: updates });
    } catch (error) {
      console.error('[AppContext] Error in batch update:', error);
      trackError(
        error,
        'AppContext.batchUpdate',
        ErrorSeverity.ERROR,
        ErrorCategory.STATE
      );
    }
  }, [trackError]);
  
  // Initialization flag
  window.BOOKINGS_DATA_READY = window.BOOKINGS_DATA_READY || false;
  
  // Make data available globally for services
  useEffect(() => {
    // Create a globally accessible object for application data
    window.appData = window.appData || {};
    
    // Only update if we have actual data
    if (state.bookingsData && state.bookingsData.length > 0) {
      console.log(`[AppContext] Making ${state.bookingsData.length} bookings available globally via window.appData`);
      window.appData.bookingsData = state.bookingsData;
      window.appData.filteredData = state.filteredData;
      window.appData.selectedYear = state.selectedYear;
      window.BOOKINGS_DATA_READY = true;
    } else {
      console.log('[AppContext] No bookings data to make available globally');
      window.BOOKINGS_DATA_READY = false;
    }
  }, [state.bookingsData, state.filteredData, state.selectedYear]);
  
  // Value object
  const value = {
    // State
    ...state,
    
    // Actions
    setBookingsData,
    setFilteredData,
    setCurrentPage,
    setCurrentView,
    setIsLoading,
    setSelectedYear,
    setActiveFilters,
    setCategoryType,
    setSelectedCategory,
    setSort,
    batchUpdate,
    
    // Constants
    CONSTANTS,
    ViewTypes,
    FilterTypes,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}