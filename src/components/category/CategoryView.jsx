import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { statsService } from '../../services/statsService';
import { categoryConfigs } from '../../utils/constants';
import CategoryCard from './CategoryCard';
import Loading from '../common/Loading';

/**
 * CategoryView component for displaying category-specific statistics
 * @param {Object} props - Component props
 * @param {string} props.type - Category type to display
 */
function CategoryView({ type }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { trackError } = useErrorTracker();

  // Get category configuration
  const config = categoryConfigs[type];
  if (!config) {
    console.error(`[CategoryView] No configuration found for category: ${type}`);
    return null;
  }

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      console.log('[CategoryView] No filtered data available');
      setStats(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log(`[CategoryView] Calculating stats for category: ${type}`);
      console.log('[CategoryView] Current groupedData:', groupedData);
      console.log(`[CategoryView] Grouped data for ${type}:`, groupedData[type]);
      
      // Ensure we have the required grouping
      if (!groupedData[type]) {
        console.log(`[CategoryView] No grouped data for ${type}, triggering groupData`);
        groupData(type);
        return; // Let the next effect run handle the stats calculation
      }
      
      // Get the grouped data for this category
      const categoryGroupedData = groupedData[type] || {};
      console.log(`[CategoryView] Processing ${Object.keys(categoryGroupedData).length} categories`);
      
      // Calculate stats for each category item
      const categoryStats = {};
      Object.keys(categoryGroupedData).forEach(key => {
        console.log(`[CategoryView] Calculating stats for ${key} with ${categoryGroupedData[key].length} bookings`);
        categoryStats[key] = statsService.calculateCategoryStats(
          categoryGroupedData[key],
          key,
          config
        );
      });
      
      console.log('[CategoryView] Final category stats:', categoryStats);
      setStats(categoryStats);
    } catch (error) {
      console.error('[CategoryView] Error calculating category stats:', error);
      trackError(
        error,
        'CategoryView.calculateStats',
        'ERROR',
        'DATA',
        { category: type }
      );
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, type, config, groupData, groupedData[type], trackError]);

  if (isLoading) {
    return <Loading size="sm" message={`Calculating ${type} statistics...`} className="my-6" />;
  }

  if (!stats) {
    console.log('[CategoryView] No stats available to display');
    return null;
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(stats).map(([key, categoryStats]) => (
          <CategoryCard
            key={key}
            title={config.formatTitle ? config.formatTitle(key) : key}
            stats={categoryStats}
            config={config}
          />
        ))}
      </div>
    </div>
  );
}

export default CategoryView;