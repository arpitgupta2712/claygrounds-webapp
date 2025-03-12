import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ViewTypes } from '../../utils/constants';
import PropTypes from 'prop-types';
import locations from '../../locations.json';

// Create a map of paths to view types for easy lookup
const PATH_TO_VIEW = {
  'table': ViewTypes.TABLE,
  'locations': ViewTypes.LOCATIONS,
  'months': ViewTypes.MONTHS,
  'sports': ViewTypes.SPORTS,
  'status': ViewTypes.STATUS,
  'source': ViewTypes.SOURCE,
  'payments': ViewTypes.PAYMENTS
};

// Category options with their paths and labels
const CATEGORY_OPTIONS = [
  { path: 'locations', label: 'Location' },
  { path: 'months', label: 'Month' },
  { path: 'sports', label: 'Sport' },
  { path: 'status', label: 'Status' },
  { path: 'source', label: 'Source' }
];

/**
 * Navigation component for switching between dashboard views
 * @param {Object} props - Component props
 * @param {Function} props.onViewChange - Callback when view changes
 */
function Navigation({ onViewChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentView, setCurrentView, selectedYear, setSelectedYear } = useApp();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Track if we've processed initial path yet
  const initialPathProcessedRef = useRef(false);
  // Store the last processed path to prevent duplicate processing
  const lastProcessedPathRef = useRef('');
  
  // Process path changes once and only update view if needed
  useEffect(() => {
    // Skip if we've already processed this path
    if (lastProcessedPathRef.current === location.pathname) {
      return;
    }
    
    // Update our record of the last processed path
    lastProcessedPathRef.current = location.pathname;
    
    // Extract the relevant part of the path
    const pathSegment = location.pathname.split('/').filter(Boolean).pop();
    
    // Lookup the view type for this path
    const viewForPath = PATH_TO_VIEW[pathSegment];
    
    // If no view found for path, default to table view
    const newView = viewForPath || ViewTypes.TABLE;
    
    // Always update the view on initial load or when it changes
    if (!initialPathProcessedRef.current || newView !== currentView) {
      console.log(`[Navigation] ${initialPathProcessedRef.current ? 'Path changed' : 'Initial path'} - setting view to ${newView}`);
      setCurrentView(newView);
      
      // Notify parent of the change if this isn't the initial load
      if (initialPathProcessedRef.current && onViewChange && typeof onViewChange === 'function') {
        console.log(`[Navigation] Notifying parent of view change to ${newView}`);
        onViewChange(newView);
      }
      
      // Mark initial path as processed
      initialPathProcessedRef.current = true;
    }
  }, [location.pathname, currentView, setCurrentView, onViewChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCategoriesOpen && !event.target.closest('.categories-dropdown')) {
        setIsCategoriesOpen(false);
      }
      if (isYearSelectorOpen && !event.target.closest('.year-selector-dropdown')) {
        setIsYearSelectorOpen(false);
      }
      if (isReportsOpen && !event.target.closest('.reports-dropdown')) {
        setIsReportsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoriesOpen, isYearSelectorOpen, isReportsOpen]);

  return (
    <div className="mb-6 bg-background-light rounded-md p-2 shadow-sm">
      <nav 
        className="flex justify-center gap-3 flex-wrap"
        role="navigation" 
        aria-label="Main navigation"
      >

                {/* Year Selector Dropdown */}
                <div className="relative year-selector-dropdown">
          <button
            onClick={() => setIsYearSelectorOpen(!isYearSelectorOpen)}
            className={`text-text-light py-3 px-6 rounded transition-colors min-w-[120px] text-center font-medium
                     hover:bg-gray-100 hover:text-primary flex items-center justify-center gap-2
                     ${isYearSelectorOpen ? 'bg-primary text-white shadow-md' : ''}`}
          >
            Select Year
            <svg 
              className={`w-4 h-4 transition-transform ${isYearSelectorOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isYearSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
              <button
                className={`w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-100
                          ${selectedYear === '202425' ? 'bg-primary text-white' : ''}`}
                onClick={() => {
                  setSelectedYear('202425');
                  setIsYearSelectorOpen(false);
                }}
              >
                2024-25
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-100
                          ${selectedYear === '202526' ? 'bg-primary text-white' : ''}`}
                onClick={() => {
                  setSelectedYear('202526');
                  setIsYearSelectorOpen(false);
                }}
              >
                2025-26
              </button>
            </div>
          )}
        </div>

        <NavLink
          to="/dashboard/table"
          className={({ isActive }) => 
            `text-text-light py-3 px-6 rounded transition-colors min-w-[120px] text-center font-medium
             hover:bg-gray-100 hover:text-primary
             ${isActive ? 'bg-primary text-white shadow-md' : ''}`
          }
          aria-current={currentView === ViewTypes.TABLE ? 'page' : undefined}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/dashboard/payments"
          className={({ isActive }) => 
            `text-text-light py-3 px-6 rounded transition-colors min-w-[120px] text-center font-medium
             hover:bg-gray-100 hover:text-primary
             ${isActive ? 'bg-primary text-white shadow-md' : ''}`
          }
          aria-current={currentView === ViewTypes.PAYMENTS ? 'page' : undefined}
        >
          Payments
        </NavLink>
        
        {/* Categories Dropdown */}
        <div className="relative categories-dropdown">
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className={`text-text-light py-3 px-6 rounded transition-colors min-w-[120px] text-center font-medium
                     hover:bg-gray-100 hover:text-primary flex items-center justify-center gap-2
                     ${isCategoriesOpen ? 'bg-primary text-white shadow-md' : ''}`}
          >
            Categories
            <svg 
              className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isCategoriesOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
              {CATEGORY_OPTIONS.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={`/dashboard/${path}`}
                  className={({ isActive }) => 
                    `block px-4 py-2 text-sm text-text-light hover:bg-gray-100
                     ${isActive ? 'bg-primary text-white' : ''}`
                  }
                  onClick={() => setIsCategoriesOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Reports Dropdown */}
        <div className="relative reports-dropdown">
          <button
            onClick={() => setIsReportsOpen(!isReportsOpen)}
            className={`text-text-light py-3 px-6 rounded transition-colors min-w-[120px] text-center font-medium
                     hover:bg-gray-100 hover:text-primary flex items-center justify-center gap-2
                     ${isReportsOpen ? 'bg-primary text-white shadow-md' : ''}`}
          >
            Reports
            <svg 
              className={`w-4 h-4 transition-transform ${isReportsOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isReportsOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200 max-h-96 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location.Location_id}
                  className={`w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-100
                            ${selectedLocation === location.Location_id ? 'bg-primary text-white' : ''}`}
                  onClick={() => {
                    setSelectedLocation(location.Location_id);
                    setIsReportsOpen(false);
                    
                    // Navigate to the location report page
                    const reportPath = `/dashboard/reports/${location.Location_id}`;
                    console.log(`[Navigation] Navigating to location report: ${reportPath}`);
                    navigate(reportPath);
                  }}
                >
                  {location.Location_name}
                </button>
              ))}
            </div>
          )}
        </div>

      </nav>
    </div>
  );
}

Navigation.propTypes = {
  onViewChange: PropTypes.func
};

export default Navigation;