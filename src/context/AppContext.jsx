import { createContext, useState, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
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
  const { handleAsync, handleError } = useErrorHandler();
  
  // Action creators with error handling
  const setBookingsData = useCallback((data) => {
    console.log('[AppContext] Setting bookings data, length:', data?.length);
    if (!data) return;
    
    handleAsync(
      async () => {
        // Make the data available globally for debugging
        if (Array.isArray(data) && data.length > 0) {
          console.log('[AppContext] Making bookings data available globally');
          window.__BOOKINGS_DATA = data;
        } else {
          console.log('[AppContext] No bookings data to make available globally');
          delete window.__BOOKINGS_DATA;
        }
        
        dispatch({ type: ActionTypes.SET_BOOKINGS_DATA, payload: data });
      },
      'AppContext.setBookingsData',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          dataLength: data?.length,
          hasData: !!data
        }
      }
    );
  }, [handleAsync]);
  
  const setFilteredData = useCallback((data) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting filtered data, length:', data?.length);
        dispatch({ type: ActionTypes.SET_FILTERED_DATA, payload: data });
      },
      'AppContext.setFilteredData',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          dataLength: data?.length,
          hasData: !!data
        }
      }
    );
  }, [handleAsync]);
  
  const setCurrentPage = useCallback((page) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting current page:', page);
        dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: page });
      },
      'AppContext.setCurrentPage',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          page,
          previousPage: state.currentPage
        }
      }
    );
  }, [handleAsync, state.currentPage]);
  
  const setCurrentView = useCallback((view) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting current view:', view);
        dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
      },
      'AppContext.setCurrentView',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          view,
          previousView: state.currentView
        }
      }
    );
  }, [handleAsync, state.currentView]);
  
  const setIsLoading = useCallback((isLoading) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting loading state:', isLoading);
        dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
      },
      'AppContext.setIsLoading',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          isLoading,
          previousLoadingState: state.isLoading
        }
      }
    );
  }, [handleAsync, state.isLoading]);
  
  const setSelectedYear = useCallback((year) => {
    handleAsync(
      async () => {
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
      },
      'AppContext.setSelectedYear',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          year,
          previousYear: state.selectedYear,
          isYearChange: year !== state.selectedYear
        }
      }
    );
  }, [handleAsync, state.selectedYear]);
  
  const setActiveFilters = useCallback((filters) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting active filters:', filters);
        dispatch({ type: ActionTypes.SET_ACTIVE_FILTERS, payload: filters });
      },
      'AppContext.setActiveFilters',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          filters,
          previousFilters: state.activeFilters,
          hasFilters: !!filters?.type || !!filters?.value
        }
      }
    );
  }, [handleAsync, state.activeFilters]);
  
  const setCategoryType = useCallback((categoryType) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting category type:', categoryType);
        dispatch({ type: ActionTypes.SET_CATEGORY_TYPE, payload: categoryType });
      },
      'AppContext.setCategoryType',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          categoryType,
          previousType: state.currentCategoryType
        }
      }
    );
  }, [handleAsync, state.currentCategoryType]);
  
  const setSelectedCategory = useCallback((category) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting selected category:', category);
        dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: category });
      },
      'AppContext.setSelectedCategory',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          category,
          previousCategory: state.selectedCategory,
          categoryType: state.currentCategoryType
        }
      }
    );
  }, [handleAsync, state.selectedCategory, state.currentCategoryType]);
  
  const setSort = useCallback((field, direction) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Setting sort:', { field, direction });
        dispatch({ 
          type: ActionTypes.SET_SORT, 
          payload: { field, direction }
        });
      },
      'AppContext.setSort',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          field,
          direction,
          previousField: state.sortField,
          previousDirection: state.sortDirection
        }
      }
    );
  }, [handleAsync, state.sortField, state.sortDirection]);
  
  const batchUpdate = useCallback((updates) => {
    handleAsync(
      async () => {
        console.log('[AppContext] Performing batch update:', updates);
        dispatch({ type: ActionTypes.BATCH_UPDATE, payload: updates });
      },
      'AppContext.batchUpdate',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          updateKeys: Object.keys(updates),
          hasUpdates: !!updates && Object.keys(updates).length > 0
        }
      }
    );
  }, [handleAsync]);

  const value = {
    ...state,
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
    batchUpdate
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}