import { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useFilters } from '../../hooks/useFilters';
import { FilterTypes } from '../../utils/constants';

/**
 * FilterControls component for data filtering
 * Handles various filter types: dates, text, location, balance
 */
function FilterControls() {
  const [isFilterTypeOpen, setIsFilterTypeOpen] = useState(false);
  const resetTriggeredRef = useRef(false);
  const { activeFilters } = useApp();
  
  const {
    filterType,
    singleDate,
    startDate,
    endDate,
    locationValue,
    textValue,
    balanceChecked,
    setFilterType,
    setSingleDate,
    setStartDate,
    setEndDate,
    setLocationValue,
    setTextValue,
    setBalanceChecked,
    isInputVisible,
    getTextPlaceholder,
    getLocations,
    applyFilter,
    resetFilter,
    initFromActiveFilters
  } = useFilters();

  // Initialize filters from active filters on mount
  useEffect(() => {
    // Only initialize from active filters if not coming from a reset
    if (!resetTriggeredRef.current) {
      initFromActiveFilters();
    } else {
      resetTriggeredRef.current = false;
    }
  }, [initFromActiveFilters, activeFilters]);

  // Get locations for dropdown
  const locations = getLocations();

  // Close filter type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterTypeOpen && !event.target.closest('.filter-type-dropdown')) {
        setIsFilterTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterTypeOpen]);

  // Get the display label for the current filter type
  const getFilterTypeLabel = () => {
    if (!filterType) return 'Select Filter';
    const option = Object.entries(FilterTypes).find(([_, value]) => value === filterType);
    return option ? option[0].replace(/_/g, ' ') : 'Select Filter';
  };

  // Enhanced reset handler that tracks the reset to prevent re-initialization
  const handleResetFilter = () => {
    resetTriggeredRef.current = true;
    resetFilter();
  };

  return (
    <div className="mb-8 p-4 lg:p-6 bg-background-light rounded-md flex flex-wrap gap-5 items-center">
      {/* Filter Section */}
      <div className="flex flex-wrap gap-5 items-center w-full">
        {/* Filter Type Selector */}
        <div className="relative filter-type-dropdown">
          <button
            onClick={() => setIsFilterTypeOpen(!isFilterTypeOpen)}
            className={`text-text-light py-3 px-6 rounded transition-colors min-w-[180px] text-center font-medium
                     hover:bg-gray-100 hover:text-primary flex items-center justify-center gap-2
                     ${isFilterTypeOpen ? 'bg-primary text-white shadow-md' : ''}`}
          >
            {getFilterTypeLabel()}
            <svg 
              className={`w-4 h-4 transition-transform ${isFilterTypeOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isFilterTypeOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
              <button
                className={`w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-100
                          ${!filterType ? 'bg-primary text-white' : ''}`}
                onClick={() => {
                  setFilterType('');
                  setIsFilterTypeOpen(false);
                }}
              >
                Select Filter
              </button>
              {Object.entries(FilterTypes).map(([key, value]) => (
                <button
                  key={value}
                  className={`w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-100
                            ${filterType === value ? 'bg-primary text-white' : ''}`}
                  onClick={() => {
                    setFilterType(value);
                    setIsFilterTypeOpen(false);
                  }}
                >
                  {key.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Single Date Input */}
        {isInputVisible('singleDate') && (
          <input
            type="date"
            id="singleDateInput"
            className="py-3 px-5 rounded border border-gray-300 bg-white text-text-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
            value={singleDate}
            onChange={(e) => setSingleDate(e.target.value)}
          />
        )}

        {/* Date Range Inputs */}
        {isInputVisible('dateRange') && (
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              id="startDate"
              className="py-3 px-5 rounded border border-gray-300 bg-white text-text-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              id="endDate"
              className="py-3 px-5 rounded border border-gray-300 bg-white text-text-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}

        {/* Location Select */}
        {isInputVisible('location') && (
          <select
            id="locationSelect"
            className="py-3 px-5 rounded border border-gray-300 bg-white text-text-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        )}

        {/* Text Input (Customer, Booking Ref, Phone) */}
        {isInputVisible('text') && (
          <input
            type="text"
            id="textInput"
            className="py-3 px-5 rounded border border-gray-300 bg-white text-text-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
            placeholder={getTextPlaceholder()}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
          />
        )}

        {/* Balance Checkbox */}
        {isInputVisible('balance') && (
          <div className="flex gap-2 items-center py-3 px-5 rounded border border-gray-300 bg-white">
            <input
              type="checkbox"
              id="balanceCheckbox"
              className="w-4 h-4 text-primary focus:ring-primary rounded border-gray-300"
              checked={balanceChecked}
              onChange={(e) => setBalanceChecked(e.target.checked)}
            />
            <label htmlFor="balanceCheckbox" className="text-text-medium">
              Show Outstanding Balance Only
            </label>
          </div>
        )}

        {/* Filter Action Buttons */}
        <button
          id="applyFilter"
          className="py-3 px-5 bg-primary text-white rounded shadow hover:bg-primary-light transition-colors min-w-[100px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={applyFilter}
          disabled={!filterType}
        >
          Apply Filter
        </button>
        
        <button
          id="resetFilter"
          className="py-3 px-5 bg-white border border-gray-300 text-text-medium rounded hover:bg-gray-50 transition-colors min-w-[100px] font-medium"
          onClick={handleResetFilter}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default FilterControls;