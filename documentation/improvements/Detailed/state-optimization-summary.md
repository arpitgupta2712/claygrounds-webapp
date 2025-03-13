# Practical Guide to Implementing State Management Optimizations

This guide provides a step-by-step approach to implementing the state management optimizations we discussed. Each section includes practical code examples, implementation steps, and expected outcomes.

## Contents

1. [Overview of Current Structure](#overview-of-current-structure)
2. [Implementation Plan](#implementation-plan)
3. [Step 1: Consolidate State Logic](#step-1-consolidate-state-logic)
4. [Step 2: Implement State Slices](#step-2-implement-state-slices)
5. [Step 3: Use Reducer Patterns Consistently](#step-3-use-reducer-patterns-consistently)
6. [Step 4: Implement Selective Context Updates](#step-4-implement-selective-context-updates)
7. [Step 5: Implement Context Selectors](#step-5-implement-context-selectors)
8. [Step 6: Optimize useEffect Dependencies](#step-6-optimize-useeffect-dependencies)
7. [Step 7: Add State Persistence](#step-7-add-state-persistence)
8. [Testing and Verification](#testing-and-verification)

## Overview of Current Structure

Your current state management approach uses:

1. **React Context API**: `AppContext.jsx` and `AuthContext.jsx` provide global state
2. **Custom Hooks**: `useBookings.jsx`, `useFilters.jsx`, etc. manage specific functionality
3. **Reducer Patterns**: Partially implemented in `AppContext.jsx`

Key issues to address:

- State duplication between context and hooks
- Potential for unnecessary re-renders
- Complex dependency chains in useEffect hooks
- Lack of persistence for important state

## Implementation Plan

We'll approach the optimization incrementally:

1. First, consolidate overlapping state logic
2. Implement state slices for better organization
3. Consistently use reducer patterns
4. Add optimizations for render performance
5. Implement selector pattern for efficient component updates
6. Optimize effect dependencies
7. Add persistence for important state

This approach allows you to make improvements one file at a time without disrupting the entire application.

## Step 1: Consolidate State Logic

**Goal**: Consolidate overlapping logic between `AppContext.jsx` and `useBookings.jsx`

### Implementation Steps:

1. First, identify overlapping state and functions
2. Move data fetching and core state to AppContext
3. Refactor useBookings to use AppContext for data

### Code Example:

```javascript
// Updated AppContext.jsx

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useErrorTracker } from '../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

// Initial state
const initialState = {
  // Data State
  bookingsData: [],
  filteredData: [],
  groupedData: {}, // New: store grouped data here
  
  // UI State
  currentPage: 1,
  currentView: ViewTypes.TABLE,
  isLoading: false,
  
  // Other state...
};

// Action types
const ActionTypes = {
  // Existing action types...
  FETCH_BOOKINGS_START: 'FETCH_BOOKINGS_START',
  FETCH_BOOKINGS_SUCCESS: 'FETCH_BOOKINGS_SUCCESS',
  FETCH_BOOKINGS_ERROR: 'FETCH_BOOKINGS_ERROR',
  SET_GROUPED_DATA: 'SET_GROUPED_DATA',
  // ...
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    // Existing cases...
    
    case ActionTypes.FETCH_BOOKINGS_START:
      return { ...state, isLoading: true };
      
    case ActionTypes.FETCH_BOOKINGS_SUCCESS:
      return { 
        ...state, 
        bookingsData: action.payload, 
        filteredData: action.payload, 
        isLoading: false,
        error: null
      };
      
    case ActionTypes.FETCH_BOOKINGS_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    
    case ActionTypes.SET_GROUPED_DATA:
      return { 
        ...state, 
        groupedData: { 
          ...state.groupedData, 
          [action.payload.key]: action.payload.data 
        } 
      };
    
    // Other cases...
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { trackError } = useErrorTracker();
  
  // Add data fetching function
  const loadBookings = useCallback(async (year = state.selectedYear, forceRefresh = false) => {
    try {
      dispatch({ type: ActionTypes.FETCH_BOOKINGS_START });
      
      console.log(`[AppContext] Loading bookings for year: ${year}`);
      const data = await dataService.loadBookings(year, forceRefresh);
      
      dispatch({ 
        type: ActionTypes.FETCH_BOOKINGS_SUCCESS, 
        payload: data 
      });
      
      return data;
    } catch (error) {
      console.error('[AppContext] Error loading bookings:', error);
      
      dispatch({ 
        type: ActionTypes.FETCH_BOOKINGS_ERROR, 
        payload: error.message 
      });
      
      trackError(
        error,
        'AppContext.loadBookings',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
      
      return null;
    }
  }, [state.selectedYear, trackError]);
  
  // Add grouping function
  const groupData = useCallback((groupBy, data = state.filteredData) => {
    if (!data?.length) return;

    try {
      console.log(`[AppContext] Grouping data by: ${groupBy}`);
      
      let grouped;
      // Grouping logic from original useBookings.jsx
      switch (groupBy) {
        case 'date':
          grouped = groupingService.groupByDate(data, 'day');
          break;
        // Other cases...
      }
      
      dispatch({
        type: ActionTypes.SET_GROUPED_DATA,
        payload: { key: groupBy, data: grouped }
      });
    } catch (error) {
      console.error('[AppContext] Error grouping data:', error);
      trackError(
        error,
        'AppContext.groupData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA,
        { groupBy }
      );
    }
  }, [state.filteredData, trackError]);
  
  // Other functions...
  
  // Include new functions in context value
  const value = {
    ...state,
    loadBookings,
    groupData,
    // Other functions...
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
```

### Updated useBookings.jsx:

```javascript
// Simplified useBookings.jsx
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { filterService } from '../services/filterService';
import { sortService } from '../services/sortService';

export const useBookings = () => {
  const { 
    bookingsData, 
    filteredData, 
    groupedData, 
    loadBookings, 
    groupData,
    isLoading,
    setFilteredData,
    // Other state and functions from AppContext
  } = useApp();

  // Specialized functions that still make sense in this hook
  const applyFilter = useCallback((filterType, filterValue) => {
    // Implementation using AppContext functions
  }, [/* dependencies */]);
  
  // Other specialized functions...
  
  return {
    bookingsData,
    filteredData,
    groupedData,
    isLoading,
    loadBookings,
    applyFilter,
    // Other functions...
  };
};
```

### Expected Outcome:

- Centralized data loading in AppContext
- Simplified useBookings hook that uses the AppContext
- Elimination of duplicate state and logic
- Clearer responsibility separation

## Step 2: Implement State Slices

**Goal**: Split the monolithic context into focused state slices

### Implementation Steps:

1. Create separate context providers for different concerns
2. Update imports in components
3. Compose providers in the application root

### Code Example:

```javascript
// 1. DataContext.jsx - Handles data-related state
const DataContext = createContext();

export function DataProvider({ children }) {
  // State and reducer for data management
  const [state, dispatch] = useReducer(dataReducer, initialDataState);
  
  // Data-related functions
  
  return (
    <DataContext.Provider value={{ ...state, ...dataFunctions }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}

// 2. UIContext.jsx - Handles UI-related state
const UIContext = createContext();

export function UIProvider({ children }) {
  // State and reducer for UI management
  const [state, dispatch] = useReducer(uiReducer, initialUIState);
  
  // UI-related functions
  
  return (
    <UIContext.Provider value={{ ...state, ...uiFunctions }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}

// 3. App.jsx - Compose providers
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <UIProvider>
            <Router>
              {/* Application routes */}
            </Router>
          </UIProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### Example Component Using Multiple Contexts:

```javascript
function BookingTable() {
  // Get only what's needed from each context
  const { filteredData, groupedData } = useData();
  const { currentPage, rowsPerPage } = useUI();
  
  // Component logic using both contexts
}
```

### Expected Outcome:

- Better separation of concerns
- More focused re-renders
- Clearer component dependencies
- Easier to maintain and extend state logic

## Step 3: Use Reducer Patterns Consistently

**Goal**: Use consistent reducer patterns across all state management

### Implementation Steps:

1. Define comprehensive action types
2. Implement detailed reducers with proper state updates
3. Use dispatch consistently with payload structure

### Code Example:

```javascript
// Action types in a separate file
// actionTypes.js
export const DataActionTypes = {
  FETCH_START: 'data/fetchStart',
  FETCH_SUCCESS: 'data/fetchSuccess',
  FETCH_ERROR: 'data/fetchError',
  FILTER_DATA: 'data/filterData',
  SORT_DATA: 'data/sortData',
  GROUP_DATA: 'data/groupData',
  // More specific action types...
};

export const UIActionTypes = {
  SET_PAGE: 'ui/setPage',
  SET_VIEW: 'ui/setView',
  SET_ROWS_PER_PAGE: 'ui/setRowsPerPage',
  TOGGLE_SIDEBAR: 'ui/toggleSidebar',
  // Other UI actions...
};

// Reducer implementation
// dataReducer.js
export function dataReducer(state, action) {
  switch (action.type) {
    case DataActionTypes.FETCH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case DataActionTypes.FETCH_SUCCESS:
      return {
        ...state,
        bookingsData: action.payload,
        filteredData: action.payload,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      };
      
    case DataActionTypes.FETCH_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case DataActionTypes.FILTER_DATA:
      return {
        ...state,
        filteredData: action.payload.data,
        activeFilters: action.payload.filters,
        currentPage: 1 // Reset to first page when filtering
      };
    
    // Other cases with detailed updates...
    
    default:
      return state;
  }
}

// Using action creators for consistency
// dataActions.js
export const dataActions = {
  fetchStart: () => ({
    type: DataActionTypes.FETCH_START
  }),
  
  fetchSuccess: (data) => ({
    type: DataActionTypes.FETCH_SUCCESS,
    payload: data
  }),
  
  fetchError: (error) => ({
    type: DataActionTypes.FETCH_ERROR,
    payload: error.message
  }),
  
  filterData: (data, filters) => ({
    type: DataActionTypes.FILTER_DATA,
    payload: { data, filters }
  }),
  
  // Other action creators...
};

// Example usage in context
function loadBookings(year) {
  dispatch(dataActions.fetchStart());
  
  dataService.loadBookings(year)
    .then(data => dispatch(dataActions.fetchSuccess(data)))
    .catch(error => dispatch(dataActions.fetchError(error)));
}
```

### Expected Outcome:

- Predictable state updates
- Better debugging capabilities
- Clear action history for state changes
- Easier to understand state flow

## Step 4: Implement Selective Context Updates

**Goal**: Optimize rendering performance with selective context updates

### Implementation Steps:

1. Split context state into smaller pieces
2. Use useMemo for context values
3. Create selective provider components

### Code Example:

```javascript
// Context with granular updates
const BookingsDataContext = createContext();
const BookingsUIContext = createContext();
const BookingsFiltersContext = createContext();

export function BookingsProvider({ children }) {
  // State management 
  const [data, dataDispatch] = useReducer(dataReducer, initialDataState);
  const [ui, uiDispatch] = useReducer(uiReducer, initialUIState);
  const [filters, filtersDispatch] = useReducer(filtersReducer, initialFiltersState);
  
  // Memoize values to prevent unnecessary re-renders
  const dataValue = useMemo(() => ({
    ...data,
    loadBookings: () => {/*...*/},
    refreshData: () => {/*...*/}
  }), [data]);
  
  const uiValue = useMemo(() => ({
    ...ui,
    setCurrentPage: (page) => uiDispatch({ type: 'SET_PAGE', payload: page }),
    setRowsPerPage: (rows) => uiDispatch({ type: 'SET_ROWS_PER_PAGE', payload: rows })
  }), [ui]);
  
  const filtersValue = useMemo(() => ({
    ...filters,
    applyFilter: (type, value) => {/*...*/},
    clearFilters: () => {/*...*/}
  }), [filters]);
  
  // Nest providers to minimize re-renders
  return (
    <BookingsDataContext.Provider value={dataValue}>
      <BookingsUIContext.Provider value={uiValue}>
        <BookingsFiltersContext.Provider value={filtersValue}>
          {children}
        </BookingsFiltersContext.Provider>
      </BookingsUIContext.Provider>
    </BookingsDataContext.Provider>
  );
}

// Custom hooks to access specific contexts
export function useBookingsData() {
  return useContext(BookingsDataContext);
}

export function useBookingsUI() {
  return useContext(BookingsUIContext);
}

export function useBookingsFilters() {
  return useContext(BookingsFiltersContext);
}

// Example component using specific context
function Pagination() {
  // Only re-renders when UI state changes
  const { currentPage, totalPages, setCurrentPage } = useBookingsUI();
  
  return (
    <div>
      <button onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
    </div>
  );
}
```

### Expected Outcome:

- Reduced component re-renders
- Better performance for complex UIs
- More targeted state updates
- Clearer component dependencies

## Step 5: Implement Context Selectors

**Goal**: Further optimize render performance with selector pattern

### Implementation Steps:

1. Create selector functions
2. Implement a useSelector hook for each context
3. Update components to use selectors

### Code Example:

```javascript
// Extend the context with selector capability
// bookingsSelectors.js
export const bookingsSelectors = {
  getTotalBookings: state => state.filteredData.length,
  getPagedData: state => {
    const { filteredData, currentPage, rowsPerPage } = state;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  },
  getBookingById: (state, id) => 
    state.bookingsData.find(booking => booking['Booking Reference'] === id),
  getIsLoading: state => state.isLoading,
  getActiveFilters: state => state.activeFilters,
  // More selectors...
};

// Create a selector hook
export function useBookingsSelector(selectorFn, deps = []) {
  const context = useContext(BookingsDataContext);
  
  // Memoize the selector result
  return useMemo(() => {
    if (!context) {
      throw new Error('useBookingsSelector must be used within a BookingsProvider');
    }
    return selectorFn(context);
  }, [context, selectorFn, ...deps]);
}

// Example usage in components
function BookingsSummary() {
  // Only re-renders when the count changes
  const totalBookings = useBookingsSelector(bookingsSelectors.getTotalBookings);
  
  return <div>Total Bookings: {totalBookings}</div>;
}

function BookingsTable() {
  // Only re-renders when the paged data changes
  const pagedData = useBookingsSelector(bookingsSelectors.getPagedData);
  
  return (
    <table>
      <tbody>
        {pagedData.map(booking => (
          <tr key={booking['Booking Reference']}>
            {/* Row data */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Expected Outcome:

- Minimal re-renders
- Component updates only when relevant data changes
- Better performance for complex views
- More declarative component data needs

## Step 6: Optimize useEffect Dependencies

**Goal**: Prevent unnecessary effect re-runs and improve performance

### Implementation Steps:

1. Audit current useEffect dependencies
2. Implement useRef for tracking values without triggering re-renders
3. Use callback refs for complex objects

### Code Example:

```javascript
// Before optimization
useEffect(() => {
  // Effect logic that runs too often
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
  batchUpdate,
  groupData
]);

// After optimization
function Component() {
  // Store complex objects in refs
  const depsRef = useRef({
    activeFilters,
    sortField,
    sortDirection
  });
  
  // Update ref when values change
  useEffect(() => {
    // Only update ref if values have actually changed
    if (
      depsRef.current.activeFilters !== activeFilters ||
      depsRef.current.sortField !== sortField ||
      depsRef.current.sortDirection !== sortDirection
    ) {
      depsRef.current = {
        activeFilters,
        sortField,
        sortDirection
      };
    }
  }, [activeFilters, sortField, sortDirection]);
  
  // Main effect depends on fewer changing dependencies
  useEffect(() => {
    // Main effect logic
    
    // We can access the latest values from the ref
    const { activeFilters, sortField, sortDirection } = depsRef.current;
    
    // Use these values in the effect
  }, [selectedYear, session]); // Much fewer dependencies
  
  // For functions, use useCallback
  const handleFilterChange = useCallback((type, value) => {
    // Filter logic
  }, [/* minimal dependencies */]);
  
  // For computed values, use useMemo
  const filteredData = useMemo(() => {
    // Expensive filtering operation
    return data.filter(item => /* logic */);
  }, [data, filterCriteria]);
}
```

### Expected Outcome:

- Fewer effect re-runs
- Better performance
- More predictable behavior
- Clearer dependency management

## Step 7: Add State Persistence

**Goal**: Persist important state across sessions for better UX

### Implementation Steps:

1. Identify state that should persist
2. Implement storage and hydration logic
3. Add persistence to reducers

### Code Example:

```javascript
// Create a persistence utility
// persistenceUtils.js
export const persistenceUtils = {
  saveState(key, state) {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  },
  
  loadState(key) {
    try {
      const serializedState = localStorage.setItem(key);
      if (!serializedState) return undefined;
      return JSON.parse(serializedState);
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      return undefined;
    }
  }
};

// Use in context initialization
// AppContext.jsx
export function AppProvider({ children }) {
  // Load initial state from localStorage
  const savedUIState = persistenceUtils.loadState('ui-state');
  
  const [state, dispatch] = useReducer(
    appReducer, 
    {
      ...initialState,
      // Override with saved values if available
      ...(savedUIState || {})
    }
  );
  
  // Save UI state when it changes
  useEffect(() => {
    // Only save UI-related state, not entire state
    const stateToSave = {
      selectedYear: state.selectedYear,
      currentView: state.currentView,
      rowsPerPage: state.rowsPerPage
    };
    
    persistenceUtils.saveState('ui-state', stateToSave);
  }, [state.selectedYear, state.currentView, state.rowsPerPage]);
  
  // Rest of provider implementation
}
```

### Expected Outcome:

- Improved user experience
- Preserved settings between sessions
- Faster perceived loading time
- Consistent user interface state

## Testing and Verification

After implementing each step, verify that:

1. The application functions as expected
2. Performance is improved (use React DevTools Profiler)
3. No regression bugs are introduced
4. State flows as expected

### Performance Testing:

1. Use React DevTools Profiler to measure render times
2. Compare before/after render counts
3. Test with larger datasets
4. Verify that UI remains responsive

### Step-by-Step Verification Checklist:

- [ ] App initializes correctly
- [ ] Data loads and displays properly
- [ ] Filtering works as expected
- [ ] Sorting functions correctly
- [ ] Pagination works smoothly
- [ ] State persists between page refreshes
- [ ] Performance is improved (fewer renders)
- [ ] No console errors or warnings appear

## Implementation Order Recommendation

For a gradual, low-risk implementation, follow this order:

1. **First**: Implement state persistence (Step 7)
2. **Second**: Optimize useEffect dependencies (Step 6)
3. **Third**: Use reducer patterns consistently (Step 3)
4. **Fourth**: Consolidate state logic (Step 1)
5. **Fifth**: Implement context selectors (Step 5)
6. **Sixth**: Implement selective context updates (Step 4)
7. **Last**: Implement state slices (Step 2)

This order allows you to make incremental improvements with the lowest risk of breaking changes, starting with non-structural optimizations before moving to architectural changes.
