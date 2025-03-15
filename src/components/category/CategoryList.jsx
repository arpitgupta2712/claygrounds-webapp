import { useState, useEffect, useMemo, useCallback } from 'react';
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
const CategoryList = React.memo(function CategoryList({ type, onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { filteredData, setCategoryType } = useApp();
  const { trackError } = useErrorTracker();
  
  // Get category configuration based on type
  const config = useMemo(() => categoryConfigs[type], [type]);
  
  // Memoize the loadCategories function
  const loadCategories = useCallback(async () => {
    if (!filteredData || !config) return;
    
    try {
      setIsLoading(true);
      const categorizedData = await dataUtils.categorizeData(filteredData, type);
      setCategories(categorizedData);
    } catch (error) {
      setError(error);
      trackError(error, 'CategoryList.loadCategories', ErrorSeverity.ERROR, ErrorCategory.DATA);
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, type, config, trackError]);

  // Load categories when filteredData or type changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Memoize the handleCardClick callback
  const handleCardClick = useCallback((category) => {
    setCategoryType(type);
    onCategorySelect?.(category);
  }, [type, onCategorySelect, setCategoryType]);

  if (error) {
    return (
      <EmptyState
        title="Error Loading Categories"
        message={error.message}
        icon="error"
      />
    );
  }

  if (isLoading) {
    return <Loading message="Loading categories..." />;
  }

  if (!categories.length) {
    return (
      <EmptyState
        title="No Categories Found"
        message="There are no categories to display for the selected filters."
      />
    );
  }

  // Memoize the grid of CategoryCards
  const categoryGrid = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => handleCardClick(category)}
          className="cursor-pointer"
        >
          <CategoryCard
            title={category.name}
            stats={category.stats}
            config={config}
          />
        </div>
      ))}
    </div>
  ), [categories, config, handleCardClick]);

  return categoryGrid;
});

CategoryList.propTypes = {
  type: PropTypes.string.isRequired,
  onCategorySelect: PropTypes.func
};

export default CategoryList;