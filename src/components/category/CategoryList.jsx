import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeGrid as Grid } from 'react-window';
import { useApp } from '../../context/AppContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { categoryConfigs } from '../../utils/constants';
import { dataUtils } from '../../utils/dataUtils';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import CategoryCard from './CategoryCard';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';

// Constants for grid layout
const CARD_WIDTH = 400; // Width of each card in pixels
const CARD_HEIGHT = 300; // Height of each card in pixels
const GRID_GAP = 24; // Gap between cards in pixels

// Memoize empty cells to prevent unnecessary renders
const EmptyCell = React.memo(() => null);

/**
 * CategoryList component displays a grid of category cards with virtualization
 * @param {Object} props - Component props
 * @param {string} props.type - Category type (locations, months, sports, status)
 * @param {Function} props.onCategorySelect - Callback when a category is selected
 */
const CategoryList = React.memo(function CategoryList({ type, onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
  
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
    
    // Cleanup function to prevent memory leaks
    return () => {
      setCategories([]);
      setGridDimensions({ width: 0, height: 0 });
    };
  }, [loadCategories]);

  // Update grid dimensions on mount and window resize with debouncing
  useEffect(() => {
    let timeoutId;
    
    const updateGridDimensions = () => {
      const gridContainer = document.getElementById('category-grid-container');
      if (gridContainer) {
        setGridDimensions({
          width: gridContainer.offsetWidth,
          height: window.innerHeight - gridContainer.offsetTop - 40
        });
      }
    };

    const debouncedUpdateDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateGridDimensions, 100);
    };

    updateGridDimensions();
    window.addEventListener('resize', debouncedUpdateDimensions);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdateDimensions);
    };
  }, []);

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

  // Calculate grid parameters
  const columnCount = Math.max(1, Math.floor((gridDimensions.width + GRID_GAP) / (CARD_WIDTH + GRID_GAP)));
  const rowCount = Math.ceil(categories.length / columnCount);

  // Memoize the cell renderer with item data
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= categories.length) return <EmptyCell />;

    const category = categories[index];
    
    // Adjust style to account for grid gap
    const adjustedStyle = {
      ...style,
      left: `${parseInt(style.left) + GRID_GAP}px`,
      top: `${parseInt(style.top) + GRID_GAP}px`,
      width: `${CARD_WIDTH}px`,
      height: `${CARD_HEIGHT}px`,
      padding: '0',
    };

    return (
      <div style={adjustedStyle}>
        <div
          onClick={() => handleCardClick(category)}
          className="h-full cursor-pointer"
        >
          <CategoryCard
            title={category.name}
            stats={category.stats}
            config={config}
          />
        </div>
      </div>
    );
  }, [categories, columnCount, handleCardClick, config]);

  // Memoize the grid component
  const VirtualizedGrid = useMemo(() => (
    <Grid
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      columnCount={columnCount}
      columnWidth={CARD_WIDTH + GRID_GAP}
      height={gridDimensions.height}
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + GRID_GAP}
      width={gridDimensions.width}
      overscanRowCount={1}
      overscanColumnCount={1}
      useIsScrolling
    >
      {Cell}
    </Grid>
  ), [Cell, columnCount, rowCount, gridDimensions.height, gridDimensions.width]);

  return (
    <div id="category-grid-container" className="h-full w-full">
      {gridDimensions.width > 0 && VirtualizedGrid}
    </div>
  );
});

CategoryList.propTypes = {
  type: PropTypes.string.isRequired,
  onCategorySelect: PropTypes.func
};

export default CategoryList;