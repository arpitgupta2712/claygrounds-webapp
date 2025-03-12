import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { categoryConfigs } from '../../utils/constants';
import { dataUtils } from '../../utils/dataUtils';
import { statsService } from '../../services/statsService';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';

// Components
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import SummaryStats from '../summary/SummaryStats';
import CategoryDetail from './CategoryDetail';

/**
 * Category view component for displaying categorized data
 * @param {Object} props Component props
 * @param {string} props.type Category type (locations, months, sports, status)
 */
function CategoryView({ type }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  
  const { bookingsData, filteredData, setCategoryType, setSelectedCategory: setAppSelectedCategory } = useApp();
  const { trackError } = useErrorTracker();
  
  // Get configuration for this category type
  const config = categoryConfigs[type];
  
  if (!config) {
    console.error(`[CategoryView] Invalid category type: ${type}`);
    return <div>Invalid category type</div>;
  }
  
  // Initialize view
  useEffect(() => {
    try {
      console.log(`[CategoryView] Initializing ${type} view`);
      setCategoryType(type);
      setIsLoading(true);
      setError(null);
      
      // Load data for this category
      if (filteredData && filteredData.length > 0) {
        const uniqueCategories = dataUtils.getUniqueValues(filteredData, config.valueField);
        
        console.log(`[CategoryView] Found ${uniqueCategories.length} unique ${type}`);
        
        // Sort categories if sort order is defined
        if (config.sortOrder) {
          uniqueCategories.sort((a, b) => {
            return config.sortOrder.indexOf(a) - config.sortOrder.indexOf(b);
          });
        }
        
        setCategories(uniqueCategories);
      } else {
        setCategories([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error(`[CategoryView] Error initializing ${type} view:`, err);
      setError(`Failed to initialize ${type} view: ${err.message}`);
      setIsLoading(false);
      
      trackError(
        err,
        'CategoryView.initialize',
        ErrorSeverity.ERROR,
        ErrorCategory.UI,
        { type }
      );
    }
  }, [type, filteredData, config, setCategoryType, trackError]);
  
  /**
   * Handle category selection
   * @param {string} category Selected category
   */
  const handleCategorySelect = (category) => {
    try {
      console.log(`[CategoryView] Selecting category: ${category}`);
      setIsLoading(true);
      setError(null);
      
      // Filter data for this category
      const data = filteredData.filter(item => item[config.valueField] === category);
      
      if (data.length === 0) {
        setError(`No data found for ${category}`);
        setIsLoading(false);
        return;
      }
      
      // Set selected category
      setSelectedCategory(category);
      setAppSelectedCategory(category);
      
      // Switch to detail view
      setIsLoading(false);
    } catch (err) {
      console.error(`[CategoryView] Error selecting category:`, err);
      setError(`Failed to load category details: ${err.message}`);
      setIsLoading(false);
      
      trackError(
        err,
        'CategoryView.handleCategorySelect',
        ErrorSeverity.ERROR,
        ErrorCategory.UI,
        { category }
      );
    }
  };
  
  /**
   * Handle back button click
   */
  const handleBack = () => {
    console.log('[CategoryView] Going back to category list');
    setSelectedCategory(null);
    setAppSelectedCategory(null);
  };
  
  // Handle sort button click
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle between asc and desc if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending when selecting a new field
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Reset sorting to default
  const resetSort = () => {
    setSortBy(null);
    setSortOrder('desc');
  };
  
  // Sort the categories based on sortBy and sortOrder
  const getSortedCategories = () => {
    if (!sortBy || !categories.length) {
      return categories;
    }
    
    return [...categories].sort((a, b) => {
      // Calculate stats for both categories
      try {
        const statsA = statsService.calculateCategoryStats(
          filteredData.filter(item => item[config.valueField] === a),
          a,
          config
        );
        
        const statsB = statsService.calculateCategoryStats(
          filteredData.filter(item => item[config.valueField] === b),
          b,
          config
        );
        
        // Get the values to compare
        let valueA, valueB;
        
        if (sortBy === 'totalBookings') {
          valueA = statsA.totalBookings || 0;
          valueB = statsB.totalBookings || 0;
        } else if (sortBy === 'totalCollection') {
          valueA = statsA.totalCollection || 0;
          valueB = statsB.totalCollection || 0;
        } else if (sortBy === 'totalOutstanding') {
          valueA = statsA.totalBalance || 0;
          valueB = statsB.totalBalance || 0;
        } else if (sortBy === 'uniqueCustomers') {
          valueA = statsA.uniqueCustomers || 0;
          valueB = statsB.uniqueCustomers || 0;
        }
        
        // Sort based on sortOrder
        return sortOrder === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      } catch (err) {
        console.error(`[CategoryView] Error sorting categories:`, err);
        return 0;
      }
    });
  };
  
  // Get the sorted categories
  const sortedCategories = getSortedCategories();
  
  // Render component
  return (
    <div className="animate-fadeIn">
      {/* Show either list view or detail view based on selection */}
      {selectedCategory ? (
        <CategoryDetail
          category={selectedCategory}
          categoryType={type}
          onBack={handleBack}
        />
      ) : (
        // List view
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-4">
            {config.category} Overview
          </h2>
          
          {isLoading ? (
            <Loading message={`Loading ${type}...`} />
          ) : categories.length === 0 ? (
            <EmptyState 
              title="No categories found" 
              message={`No ${type} found in the current data.`} 
            />
          ) : (
            <>
              {/* Sort buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleSort('totalBookings')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    sortBy === 'totalBookings' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Sort by Bookings {sortBy === 'totalBookings' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('totalCollection')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    sortBy === 'totalCollection' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Sort by Collection {sortBy === 'totalCollection' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('totalOutstanding')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    sortBy === 'totalOutstanding' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Sort by Outstanding {sortBy === 'totalOutstanding' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('uniqueCustomers')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    sortBy === 'uniqueCustomers' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Sort by Customers {sortBy === 'uniqueCustomers' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                {sortBy && (
                  <button
                    onClick={resetSort}
                    className="px-3 py-1 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-3 gap-6 mt-6">
                {sortedCategories.map((category) => (
                  <div key={category} className="aspect-[3/2]">
                    <CategoryCard 
                      category={category} 
                      config={config}
                      data={filteredData}
                      onClick={() => handleCategorySelect(category)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

CategoryView.propTypes = {
  type: PropTypes.oneOf(['locations', 'months', 'sports', 'status', 'source']).isRequired
};

/**
 * Category card component for displaying a category in the list view
 * This component will be implemented separately, but is included here for completeness
 */
function CategoryCard({ category, config, data, onClick }) {
  try {
    // Get the year from the first booking's date
    const year = data[0]?.['Date']?.split('-')[0] || '202425';
    
    // Calculate stats for this category
    const categoryBookings = data.filter(item => item[config.valueField] === category);
    const stats = statsService.calculateCategoryStats(categoryBookings, category, config, year);
    
    // Return early if no stats available
    if (!stats) {
      return (
        <div 
          className="bg-white p-6 rounded-lg shadow cursor-pointer transition duration-300 hover:shadow-md hover:bg-primary hover:text-white border border-gray-100 relative overflow-hidden group"
          onClick={onClick}
        >
          <h3 className="text-xl font-semibold mb-4 transition-colors group-hover:text-white">{category}</h3>
          <div className="text-gray-500">No data available</div>
        </div>
      );
    }
    
    // Calculate extra stats if defined in config
    const extraStats = {};
    if (config.extraStats) {
      config.extraStats.forEach(stat => {
        extraStats[stat.label] = stat.calculate(categoryBookings);
      });
    }
    
    return (
      <div 
        className="bg-white p-6 rounded-lg shadow cursor-pointer transition duration-300 hover:shadow-md hover:bg-primary hover:text-white border border-gray-100 relative overflow-hidden group"
        onClick={onClick}
      >
        <h3 className="text-2xl font-semibold mb-4 transition-colors group-hover:text-white">{category}</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="group-hover:text-white/90">Bookings</span>
            <span className="font-semibold group-hover:text-white">{stats.totalBookings || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="group-hover:text-white/90">Collection</span>
            <span className="font-semibold group-hover:text-white">₹{(stats.totalCollection || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="group-hover:text-white/90">Outstanding</span>
            <span className="font-semibold group-hover:text-white">₹{(stats.totalOutstanding || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="group-hover:text-white/90">Unique Customers</span>
            <span className="font-semibold group-hover:text-white">{stats.uniqueCustomers || 0}</span>
          </div>
          
          {/* Display extra stats */}
          {Object.entries(extraStats).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="group-hover:text-white/90">{label}</span>
              <span className="font-semibold group-hover:text-white">
                {typeof value === 'object' && value !== null && label === 'Top Customer' 
                  ? value.displayText 
                  : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (err) {
    console.error(`[CategoryCard] Error rendering card:`, err);
    return (
      <div 
        className="bg-white p-6 rounded-lg shadow cursor-pointer transition duration-300 hover:shadow-md hover:bg-primary hover:text-white border border-gray-100 relative overflow-hidden group"
        onClick={onClick}
      >
        <h3 className="text-xl font-semibold mb-4 transition-colors group-hover:text-white">{category}</h3>
        <div className="text-red-500">Error loading data</div>
      </div>
    );
  }
}

CategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired
};

export default CategoryView;