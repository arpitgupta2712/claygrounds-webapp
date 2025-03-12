import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { categoryConfigs } from '../../utils/constants';
import { dataUtils } from '../../utils/dataUtils';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import CategoryCard from './CategoryCard';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

/**
 * CategoryList component displays a grid of category cards
 * @param {Object} props - Component props
 * @param {string} props.type - Category type (locations, months, sports, status)
 * @param {Function} props.onCategorySelect - Callback when a category is selected
 */
function CategoryList({ type, onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { filteredData, setCategoryType } = useApp();
  const { trackError } = useErrorTracker();
  
  // Get category configuration based on type
  const config = categoryConfigs[type];
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Set current category type in app context
        setCategoryType(type);
        
        if (!config) {
          throw new Error(`Invalid category type: ${type}`);
        }
        
        if (!filteredData || filteredData.length === 0) {
          setCategories([]);
          return;
        }
        
        console.log(`[CategoryList] Loading categories for type: ${type}`);
        
        // Extract unique categories from data
        let categoryValues = dataUtils.getUniqueValues(filteredData, config.valueField);
        
        // Apply sort order if specified in config
        if (config.sortOrder) {
          categoryValues = categoryValues.sort((a, b) => {
            return config.sortOrder.indexOf(a) - config.sortOrder.indexOf(b);
          });
        }
        
        console.log(`[CategoryList] Found ${categoryValues.length} categories`);
        
        setCategories(categoryValues);
      } catch (error) {
        console.error(`[CategoryList] Error loading categories: ${error.message}`);
        setError(error.message);
        
        trackError(
          error,
          'CategoryList.loadCategories',
          ErrorSeverity.ERROR,
          ErrorCategory.DATA,
          { type }
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [type, filteredData, config, setCategoryType, trackError]);
  
  // Handle category selection
  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      console.log(`[CategoryList] Category selected: ${category}`);
      onCategorySelect(category);
    }
  };
  
  // If type is invalid
  if (!config) {
    return (
      <EmptyState.Error
        title="Invalid Category Type"
        message={`The category type '${type}' is not valid or not configured.`}
      />
    );
  }
  
  // Display loading state
  if (isLoading) {
    return <Loading message={`Loading ${config.category} data...`} />;
  }
  
  // Display error state
  if (error) {
    return (
      <EmptyState.Error
        title={`Error Loading ${config.category} Data`}
        message={error}
      />
    );
  }
  
  // Display empty state if no categories found
  if (categories.length === 0) {
    return (
      <EmptyState
        title={`No ${config.category} Data`}
        message={`There are no ${config.category.toLowerCase()} categories to display.`}
      />
    );
  }

  return (
    <div>
      {/* Category title */}
      <h2 className="text-xl text-primary font-semibold mb-6">
        {config.category} Overview
      </h2>
      
      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category} className="aspect-[3/2]">
            <CategoryCard
              category={category}
              config={config}
              onClick={() => handleCategoryClick(category)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

CategoryList.propTypes = {
  type: PropTypes.oneOf(['locations', 'months', 'sports', 'status', 'source']).isRequired,
  onCategorySelect: PropTypes.func
};

export default CategoryList;