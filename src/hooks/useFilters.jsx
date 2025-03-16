import { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBookings } from './useBookings';
import { useErrorHandler } from './useErrorHandler';
import { dataUtils } from '../utils/dataUtils';
import { FilterTypes, FilterConfig } from '../utils/constants';
import { ErrorSeverity, ErrorCategory } from '../utils/errorTypes';

/**
 * Custom hook for managing filter controls
 * @returns {Object} Filter state and methods
 */
export const useFilters = () => {
  const [filterType, setFilterType] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [balanceChecked, setBalanceChecked] = useState(false);

  const { bookingsData, activeFilters } = useApp();
  const { applyFilter, clearFilters } = useBookings();
  const { handleAsync, handleError } = useErrorHandler();

  /**
   * Memoized locations from data for dropdown
   * @returns {Array} Array of unique locations
   */
  const locations = useMemo(() => {
    if (!bookingsData || !bookingsData.length) return [];
    
    return handleAsync(
      async () => {
        // Use dataUtils to get unique values
        const uniqueLocations = dataUtils.getUniqueValues(bookingsData, 'Location');
        console.log(`[useFilters] Found ${uniqueLocations.length} unique locations`);
        return uniqueLocations;
      },
      'useFilters.locations',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.DATA,
        metadata: {
          dataLength: bookingsData?.length,
          hasData: !!bookingsData
        },
        onError: () => []
      }
    ) || [];
  }, [bookingsData, handleAsync]);

  /**
   * Get locations from memoized data for dropdown
   * @returns {Array} Array of unique locations
   */
  const getLocations = useCallback(() => locations, [locations]);

  /**
   * Handle filter type change
   * @param {string} type - New filter type
   */
  const handleFilterTypeChange = useCallback((type) => {
    handleAsync(
      async () => {
        console.log(`[useFilters] Changing filter type to: ${type}`);
        setFilterType(type);
        
        // Reset all filter values when changing type
        setSingleDate('');
        setStartDate('');
        setEndDate('');
        setLocationValue('');
        setTextValue('');
        setBalanceChecked(false);
      },
      'useFilters.handleFilterTypeChange',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          newType: type,
          previousType: filterType
        }
      }
    );
  }, [handleAsync, filterType]);

  /**
   * Apply filter based on current values
   */
  const handleApplyFilter = useCallback(() => {
    handleAsync(
      async () => {
        if (!filterType) {
          console.warn('[useFilters] No filter type selected');
          return;
        }

        console.log(`[useFilters] Applying filter type: ${filterType}`);

        switch (filterType) {
          case FilterTypes.SINGLE_DATE:
            if (!singleDate) {
              console.warn('[useFilters] No date selected');
              return;
            }
            applyFilter(filterType, singleDate);
            break;

          case FilterTypes.DATE_RANGE:
            if (!startDate && !endDate) {
              console.warn('[useFilters] No date range selected');
              return;
            }
            applyFilter(filterType, { startDate, endDate });
            break;

          case FilterTypes.LOCATION:
            if (!locationValue) {
              console.warn('[useFilters] No location selected');
              return;
            }
            // Debug: Log the exact location value being used
            console.log('[useFilters] Applying location filter with value:', locationValue);
            // Debug: Log a sample of bookings with this location
            const sampleBookings = bookingsData
              .filter(b => b.Location === locationValue)
              .slice(0, 3);
            console.log('[useFilters] Sample bookings with this location:', sampleBookings);
            applyFilter(filterType, locationValue);
            break;

          case FilterTypes.CUSTOMER:
          case FilterTypes.BOOKING_REF:
          case FilterTypes.PHONE:
            if (!textValue || textValue.length < 2) {
              console.warn('[useFilters] Text value too short');
              return;
            }
            applyFilter(filterType, textValue);
            break;

          case FilterTypes.BALANCE:
            applyFilter(filterType, balanceChecked);
            break;

          default:
            console.warn(`[useFilters] Unknown filter type: ${filterType}`);
        }
      },
      'useFilters.handleApplyFilter',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          filterType,
          hasValue: {
            singleDate: !!singleDate,
            dateRange: !!(startDate || endDate),
            location: !!locationValue,
            text: !!textValue,
            balance: balanceChecked
          },
          dataLength: bookingsData?.length
        }
      }
    );
  }, [
    filterType, singleDate, startDate, endDate,
    locationValue, textValue, balanceChecked,
    applyFilter, handleAsync, bookingsData
  ]);

  /**
   * Reset all filters
   */
  const handleResetFilter = useCallback(() => {
    handleAsync(
      async () => {
        console.log('[useFilters] Resetting filters');
        
        // Reset UI state
        setFilterType('');
        setSingleDate('');
        setStartDate('');
        setEndDate('');
        setLocationValue('');
        setTextValue('');
        setBalanceChecked(false);
        
        // Clear filters from data
        clearFilters();
      },
      'useFilters.handleResetFilter',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          hadFilters: !!filterType,
          previousType: filterType,
          hadValues: {
            singleDate: !!singleDate,
            dateRange: !!(startDate || endDate),
            location: !!locationValue,
            text: !!textValue,
            balance: balanceChecked
          }
        }
      }
    );
  }, [clearFilters, handleAsync, filterType, singleDate, startDate, endDate, locationValue, textValue, balanceChecked]);

  /**
   * Check if a specific input should be visible
   * @param {string} inputType - Type of input to check
   * @returns {boolean} Whether input should be visible
   */
  const isInputVisible = useCallback((inputType) => {
    switch (inputType) {
      case 'singleDate':
        return filterType === FilterTypes.SINGLE_DATE;
      case 'dateRange':
        return filterType === FilterTypes.DATE_RANGE;
      case 'location':
        return filterType === FilterTypes.LOCATION;
      case 'text':
        return [
          FilterTypes.CUSTOMER,
          FilterTypes.BOOKING_REF,
          FilterTypes.PHONE
        ].includes(filterType);
      case 'balance':
        return filterType === FilterTypes.BALANCE;
      default:
        return false;
    }
  }, [filterType]);

  /**
   * Get placeholder text for text input based on filter type
   * @returns {string} Placeholder text
   */
  const getTextPlaceholder = useCallback(() => {
    if (filterType === FilterTypes.CUSTOMER) return 'Enter customer name';
    if (filterType === FilterTypes.BOOKING_REF) return 'Enter booking reference';
    if (filterType === FilterTypes.PHONE) return 'Enter phone number';
    return 'Enter search term';
  }, [filterType]);

  /**
   * Initialize filter UI from active filters
   */
  const initFromActiveFilters = useCallback(() => {
    if (!activeFilters?.type) return;
    
    handleAsync(
      async () => {
        console.log('[useFilters] Initializing from active filters', activeFilters);
        
        setFilterType(activeFilters.type);
        
        switch (activeFilters.type) {
          case FilterTypes.SINGLE_DATE:
            setSingleDate(activeFilters.value);
            break;
            
          case FilterTypes.DATE_RANGE:
            setStartDate(activeFilters.value.startDate || '');
            setEndDate(activeFilters.value.endDate || '');
            break;
            
          case FilterTypes.LOCATION:
            setLocationValue(activeFilters.value);
            break;
            
          case FilterTypes.CUSTOMER:
          case FilterTypes.BOOKING_REF:
          case FilterTypes.PHONE:
            setTextValue(activeFilters.value);
            break;
            
          case FilterTypes.BALANCE:
            setBalanceChecked(activeFilters.value);
            break;
        }
      },
      'useFilters.initFromActiveFilters',
      {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI,
        metadata: {
          filterType: activeFilters.type,
          hasValue: !!activeFilters.value,
          valueType: typeof activeFilters.value
        }
      }
    );
  }, [activeFilters, handleAsync]);

  return {
    // State
    filterType,
    singleDate,
    startDate,
    endDate,
    locationValue,
    textValue,
    balanceChecked,
    
    // Setters
    setSingleDate,
    setStartDate,
    setEndDate,
    setLocationValue,
    setTextValue,
    setBalanceChecked,
    
    // Actions
    handleFilterTypeChange,
    handleApplyFilter,
    handleResetFilter,
    
    // Helpers
    getLocations,
    isInputVisible,
    getTextPlaceholder,
    initFromActiveFilters
  };
};