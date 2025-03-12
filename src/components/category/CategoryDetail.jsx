import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../context/AppContext';
import { statsService } from '../../services/statsService';
import { categoryConfigs } from '../../utils/constants';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { formatUtils } from '../../utils/formatUtils';

// Components
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import BookingTable from '../table/BookingTable';
import { Tooltip } from '../table/BookingTable';

/**
 * Component for displaying detailed information about a specific category
 */
function CategoryDetail({ 
  category, 
  categoryType, 
  onBack 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [stats, setStats] = useState(null);
  const { filteredData } = useApp();
  const { trackError } = useErrorTracker();
  
  // Load data for the category
  useEffect(() => {
    const loadCategoryData = async () => {
      setIsLoading(true);
      
      try {
        console.log(`[CategoryDetail] Loading data for ${categoryType}: ${category}`);
        
        const config = categoryConfigs[categoryType];
        if (!config) {
          throw new Error(`Invalid category type: ${categoryType}`);
        }
        
        // Filter data for this category
        const data = filteredData.filter(
          booking => booking[config.valueField] === category
        );
        
        console.log(`[CategoryDetail] Found ${data.length} records for ${category}`);
        
        // Calculate statistics for this category
        const categoryStats = statsService.calculateCategoryStats(
          data, 
          category, 
          config
        );
        
        setCategoryData(data);
        setStats(categoryStats);
      } catch (error) {
        console.error(`[CategoryDetail] Error loading data for ${category}:`, error);
        trackError(
          error,
          'CategoryDetail.loadCategoryData',
          ErrorSeverity.ERROR,
          ErrorCategory.DATA,
          { categoryType, category }
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    if (category && categoryType) {
      loadCategoryData();
    }
  }, [category, categoryType, filteredData, trackError]);
  
  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };
  
  if (isLoading) {
    return <Loading message={`Loading ${categoryType} details...`} />;
  }
  
  if (!stats || categoryData.length === 0) {
    return (
      <EmptyState 
        title={`No data for ${category}`}
        message={`There are no bookings available for this ${categoryType.slice(0, -1)}.`}
        action={
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-light transition-colors"
          >
            Back to List
          </button>
        }
      />
    );
  }
  
  return (
    <div className="animate-fadeIn">
      {/* Header with back button */}
      <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
        <button 
          onClick={handleBack}
          className="text-primary hover:text-primary-light transition-colors flex items-center gap-2"
        >
          <span className="text-xl">←</span>
          <span>Back to List</span>
        </button>
        
        <h2 className="text-xl md:text-2xl font-semibold text-primary ml-4 flex-1">
          {categoryConfigs[categoryType]?.category}: {category}
        </h2>
      </div>
      
      {/* Stats Summary */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Basic stats */}
          <StatCard title="Total Bookings" value={formatUtils.number(stats.totalBookings)} />
          <StatCard title="Total Collection" value={formatUtils.currency(stats.totalCollection)} />
          <StatCard title="Total Slots" value={formatUtils.number(stats.totalSlots)} />
          <StatCard title="Unique Customers" value={formatUtils.number(stats.uniqueCustomers)} />
          
          {/* Extra stats from config */}
          {categoryConfigs[categoryType]?.extraStats?.map(stat => (
            <StatCard 
              key={stat.label}
              title={stat.label}
              value={stats[stat.label] || 'N/A'}
            />
          ))}
        </div>
      </div>
      
      {/* Bookings Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-text-light">Bookings</h3>
        <BookingTable data={categoryData} />
      </div>
    </div>
  );
}

/**
 * Statistic Card Component
 */
function StatCard({ title, value }) {
  // Handle case when value is an object (for Top Customer with phone)
  if (title === 'Top Customer' && typeof value === 'object' && value !== null) {
    return (
      <div className="bg-white p-6 rounded-lg shadow transition-all hover:shadow-md border border-gray-100">
        <h3 className="text-sm uppercase text-text-light font-semibold tracking-wider mb-2">{title}</h3>
        <Tooltip content={`Phone: ${value.phone}`}>
          <p className="text-2xl font-semibold text-primary cursor-help">{value.displayText}</p>
        </Tooltip>
      </div>
    );
  }
  
  // Default case for other stats
  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all hover:shadow-md border border-gray-100">
      <h3 className="text-sm uppercase text-text-light font-semibold tracking-wider mb-2">{title}</h3>
      <p className="text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

CategoryDetail.propTypes = {
  category: PropTypes.string.isRequired,
  categoryType: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default CategoryDetail;