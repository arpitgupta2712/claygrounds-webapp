import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FilterTypes } from '../../utils/constants';

/**
 * FilterSelector component for filtering data based on various criteria
 */
function FilterSelector() {
  const { activeFilters, setActiveFilters } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = [
    { type: FilterTypes.LOCATION, label: 'Location' },
    { type: FilterTypes.SOURCE, label: 'Source' },
    { type: FilterTypes.SPORT, label: 'Sport' },
    { type: FilterTypes.STATUS, label: 'Status' },
    { type: FilterTypes.PAYMENT, label: 'Payment Mode' },
  ];

  const handleFilterChange = (type) => {
    if (activeFilters.type === type) {
      setActiveFilters({ type: null, value: null });
    } else {
      setActiveFilters({ type, value: null });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <i className="fas fa-filter mr-2"></i>
        {activeFilters.type ? filterOptions.find(f => f.type === activeFilters.type)?.label : 'Filter'}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {filterOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleFilterChange(option.type)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  activeFilters.type === option.type
                    ? 'bg-gray-100 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterSelector; 