import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { statsService } from '../../services/statsService';
import { categoryConfigs } from '../../utils/constants';
import { logger } from '../../utils/logger';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import CategoryCard from './CategoryCard';
import CategoryDetail from './CategoryDetail';
import Loading from '../common/Loading';
import React from 'react';
import PropTypes from 'prop-types';
import { sortService } from '../../services/sortService';

/**
 * CategoryView component for displaying category-specific statistics
 */
const CategoryView = React.memo(function CategoryView({ type }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading=true
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { handleAsync, handleError } = useErrorHandler();
  
  // Add stats cache ref
  const statsCache = useRef(new Map());
  const lastCalculationRef = useRef({ type, data: null, dataLength: 0 });

  // Memoize category configuration
  const config = useMemo(() => categoryConfigs[type], [type]);

  // Directly trigger groupData when type changes or filteredData changes
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`[CategoryView] Directly grouping data for type: ${type}`);
        setIsLoading(true);
        await groupData(type); // Directly trigger grouping when component mounts or type changes
      } catch (error) {
        console.error(`[CategoryView] Error grouping data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [type, groupData, filteredData]);

  // Memoize the grouped data for this category
  const categoryGroupedData = useMemo(() => {
    const data = groupedData[type] || {};
    console.log(`[CategoryView] Grouped data for ${type}:`, {
      keysCount: Object.keys(data).length,
      keys: Object.keys(data)
    });
    return data;
  }, [groupedData, type]);

  // Calculate stats when groupedData changes
  useEffect(() => {
    const calculateCategoryStats = async () => {
      if (!categoryGroupedData || Object.keys(categoryGroupedData).length === 0) {
        console.log(`[CategoryView] No grouped data for ${type}, skipping stats calculation`);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      try {
        console.log(`[CategoryView] Calculating stats for ${Object.keys(categoryGroupedData).length} ${type} items`);
        
        // Calculate stats for each category item in parallel
        const categoryStats = {};
        const calculations = await Promise.all(
          Object.entries(categoryGroupedData).map(async ([key, bookings]) => {
            try {
              // Calculate stats for this category
              console.log(`[CategoryView] Calculating stats for ${key} (${bookings.length} bookings)`);
              const result = await statsService.calculateCategoryStats(bookings, key, config);
              return [key, result];
            } catch (error) {
              console.error(`[CategoryView] Error calculating stats for ${key}:`, error);
              return [key, null];
            }
          })
        );
        
        // Filter out failed calculations and build stats object
        calculations.forEach(([key, result]) => {
          if (result) categoryStats[key] = result;
        });
        
        console.log(`[CategoryView] Stats calculation complete for ${type}:`, {
          keysCount: Object.keys(categoryStats).length,
          keys: Object.keys(categoryStats)
        });
        
        // Set the stats
        setStats(categoryStats);
      } catch (error) {
        console.error(`[CategoryView] Error calculating category stats: ${error.message}`);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateCategoryStats();
  }, [categoryGroupedData, config, type]);

  // Handle category card click
  const handleCategoryClick = useCallback((title, categoryStats) => {
    setSelectedCategory({
      title,
      stats: categoryStats,
      config
    });
  }, [config]);

  // Handle closing the detail view
  const handleCloseDetail = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  // Memoize category cards rendering
  const categoryCards = useMemo(() => {
    if (!stats || !config) {
      console.log(`[CategoryView] No stats or config available for rendering cards`);
      return null;
    }

    const entries = Object.entries(stats);
    console.log(`[CategoryView] Rendering ${entries.length} category cards for ${type}`);
    
    if (entries.length === 0) {
      return (
        <div className="p-6 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">No data available for the selected filter.</p>
        </div>
      );
    }
    
    const sortedEntries = type === 'months' 
  ? sortService.sortMonthsInFinancialYearOrder(entries)
  : entries.sort(([a], [b]) => a.localeCompare(b));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEntries.map(([category, categoryStats]) => (
          <CategoryCard
            key={category}
            title={category}
            stats={categoryStats}
            config={config}
            onClick={handleCategoryClick}
          />
        ))}
      </div>
    );
  }, [stats, config, handleCategoryClick, type]);

  // Show loading state
  if (isLoading) {
    return <Loading message={`Loading ${type} statistics...`} />;
  }

  // Show empty state if no grouped data
  if (!categoryGroupedData || Object.keys(categoryGroupedData).length === 0) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">No {type} data available for the selected filters.</p>
      </div>
    );
  }

  // Show empty state if no stats
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">No statistics available for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        {config.title || `${type} Statistics`}
      </h2>
      {categoryCards}

      {/* Category detail modal */}
      {selectedCategory && (
        <CategoryDetail
          category={selectedCategory}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
});

CategoryView.propTypes = {
  type: PropTypes.string.isRequired
};

export default CategoryView;