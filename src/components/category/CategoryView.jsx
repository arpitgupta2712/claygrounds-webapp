import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { statsService } from '../../services/statsService';
import { categoryConfigs } from '../../utils/constants';
import { logger } from '../../utils/logger';
import CategoryCard from './CategoryCard';
import CategoryDetail from './CategoryDetail';
import Loading from '../common/Loading';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * CategoryView component for displaying category-specific statistics
 */
const CategoryView = React.memo(function CategoryView({ type }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { trackError } = useErrorTracker();
  
  // Add stats cache ref
  const statsCache = useRef(new Map());
  const lastCalculationRef = useRef({ type, data: null });

  // Memoize category configuration
  const config = useMemo(() => categoryConfigs[type], [type]);

  // Memoize the grouped data for this category to prevent unnecessary recalculations
  const categoryGroupedData = useMemo(() => {
    return groupedData[type] || {};
  }, [groupedData, type]);

  // Check if recalculation is needed
  const shouldRecalculate = useCallback(() => {
    if (!categoryGroupedData || !filteredData) return false;
    const lastCalc = lastCalculationRef.current;
    return lastCalc.type !== type || lastCalc.data !== filteredData;
  }, [categoryGroupedData, filteredData, type]);

  // Memoize stats calculation function
  const calculateStats = useCallback(async () => {
    if (!filteredData || !config) return;
    
    // Skip if no recalculation needed
    if (!shouldRecalculate()) {
      logger.debug('[CategoryView] Using cached stats for', type);
      return;
    }

    try {
      setIsLoading(true);
      
      // Ensure we have the required grouping
      if (!groupedData[type]) {
        await groupData(type);
        return; // The useEffect will trigger again with new groupedData
      }

      // Calculate stats for each category item in parallel
      const categoryStats = {};
      const calculations = Object.entries(categoryGroupedData).map(async ([key, bookings]) => {
        try {
          // Check cache first
          const cacheKey = `${key}:${bookings.length}:${type}`;
          if (statsCache.current.has(cacheKey)) {
            return [key, statsCache.current.get(cacheKey)];
          }

          // Only log when actually calculating (not using cache)
          logger.debug(`[CategoryView] Calculating stats for ${key}`);
          const stats = await statsService.calculateCategoryStats(
            bookings,
            key,
            config
          );
          
          // Cache the result
          statsCache.current.set(cacheKey, stats);
          return [key, stats];
        } catch (error) {
          logger.error(`Error calculating stats for ${key}:`, error);
          return [key, null];
        }
      });

      // Wait for all calculations to complete
      const results = await Promise.all(calculations);
      
      // Filter out failed calculations and update state
      const validResults = results.filter(([_, result]) => result !== null);
      const categoryStatsObj = Object.fromEntries(validResults);
      
      // Update last calculation reference and set stats
      lastCalculationRef.current = { type, data: filteredData };
      setStats(categoryStatsObj);
    } catch (error) {
      logger.error('[CategoryView] Error calculating stats:', error);
      trackError(error, 'CategoryView.calculateStats', 'ERROR', 'DATA');
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, type, config, groupData, categoryGroupedData, trackError, shouldRecalculate]);

  // Calculate stats when data changes
  useEffect(() => {
    if (shouldRecalculate()) {
      calculateStats();
    }
  }, [calculateStats, shouldRecalculate]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      statsCache.current.clear();
    };
  }, []);

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

  // Memoize category cards rendering - MOVED BEFORE CONDITIONAL RETURNS
  const categoryCards = useMemo(() => {
    if (!stats || !config) return null;

    const sortedEntries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b));
    
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
  }, [stats, config, handleCategoryClick]);

  // Early return cases
  if (!config) return null;
  if (isLoading) return <Loading message="Calculating statistics..." />;
  if (!stats) return null;

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