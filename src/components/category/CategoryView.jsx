import { useEffect, useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { statsService } from '../../services/statsService';
import { categoryConfigs } from '../../utils/constants';
import CategoryCard from './CategoryCard';
import Loading from '../common/Loading';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * CategoryView component for displaying category-specific statistics
 */
const CategoryView = React.memo(function CategoryView({ type }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { filteredData } = useApp();
  const { groupedData, groupData } = useBookings();
  const { trackError } = useErrorTracker();

  // Memoize category configuration
  const config = useMemo(() => categoryConfigs[type], [type]);

  // Memoize stats calculation function
  const calculateStats = useCallback(async () => {
    if (!filteredData || !config) return;

    try {
      setIsLoading(true);
      const categoryStats = await Promise.all([
        statsService.calculateBasicStats(filteredData, type),
        statsService.calculateAdvancedStats(filteredData, type)
      ]);

      setStats({
        ...categoryStats[0],
        ...categoryStats[1]
      });
    } catch (error) {
      trackError(error, 'CategoryView.calculateStats', 'ERROR', 'DATA');
    } finally {
      setIsLoading(false);
    }
  }, [filteredData, type, config, trackError]);

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  if (!config) return null;
  if (isLoading) return <Loading message="Calculating statistics..." />;
  if (!stats) return null;

  // Memoize category cards rendering
  const categoryCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(stats).map(([category, categoryStats]) => (
        <CategoryCard
          key={category}
          title={category}
          stats={categoryStats}
          config={config}
        />
      ))}
    </div>
  ), [stats, config]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        {config.title || `${type} Statistics`}
      </h2>
      {categoryCards}
    </div>
  );
});

CategoryView.propTypes = {
  type: PropTypes.string.isRequired
};

export default CategoryView;