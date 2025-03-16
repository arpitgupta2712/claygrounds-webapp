import { useState, useEffect } from 'react';

function formatTime(ms) {
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function getPerformanceIndicator(value, thresholds) {
  if (value <= thresholds.good) return 'text-green-600';
  if (value <= thresholds.warning) return 'text-yellow-600';
  return 'text-red-600';
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Performance thresholds in milliseconds
const THRESHOLDS = {
  INITIAL_LOAD: { good: 1500, warning: 3000 },
  DOM_READY: { good: 1500, warning: 2500 },
  PAINT: { good: 1500, warning: 2500 },
  CONTENT: { good: 1500, warning: 3000 },
  HMR: { good: 500, warning: 1500 },
  MEMORY_USAGE: { good: 80, warning: 90 },
  MEMORY_GROWTH: 2,
  UPDATE_STALE: 30000
};

// Add memory optimization suggestions
function getMemoryOptimizationSuggestions(metrics) {
  const suggestions = [];
  const memoryUsagePercent = (metrics.jsHeapSize / metrics.totalJSHeapSize) * 100;
  const memoryGrowthRate = metrics.memoryHistory.length > 1
    ? ((metrics.memoryHistory[metrics.memoryHistory.length - 1] - metrics.memoryHistory[0]) 
       / metrics.memoryHistory.length) * (1000 / 2000)
    : 0;

  if (memoryUsagePercent > THRESHOLDS.MEMORY_USAGE.warning) {
    suggestions.push('High memory usage detected. Consider:');
    suggestions.push('• Using React.memo for expensive components');
    suggestions.push('• Implementing useMemo for complex calculations');
    suggestions.push('• Checking for memory leaks in useEffect cleanup');
  }

  if (memoryGrowthRate > THRESHOLDS.MEMORY_GROWTH) {
    suggestions.push('Memory growing rapidly. Check for:');
    suggestions.push('• Unbounded arrays or objects');
    suggestions.push('• Event listener cleanup');
    suggestions.push('• Cached data cleanup');
  }

  return suggestions;
}

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    // Page Performance
    initialLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    
    // HMR Performance
    lastReloadTime: 0,
    averageReloadTime: 0,
    reloadCount: 0,
    failedReloads: 0,
    
    // Memory Usage
    jsHeapSize: 0,
    totalJSHeapSize: 0,
    memoryHistory: [],
    memoryPeak: 0,
    gcSuggested: false,
    
    // React Performance
    componentUpdates: 0,
    lastUpdateTimestamp: Date.now(),
    isFirstLoad: true
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Function to get paint metrics
    const getPaintMetrics = () => {
      const paintEntries = performance.getEntriesByType('paint');
      const fp = paintEntries.find(entry => entry.name === 'first-paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      return {
        firstPaint: fp?.startTime || 0,
        firstContentfulPaint: fcp?.startTime || 0
      };
    };

    // Track initial page load metrics
    const pageLoadTime = performance.now();
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    
    // Initial metrics setup
    setMetrics(prev => ({
      ...prev,
      initialLoadTime: pageLoadTime,
      domContentLoaded: navigationEntry?.domContentLoadedEventEnd || 0,
      isFirstLoad: true
    }));

    // Wait for paint metrics to be available
    const paintMetricsTimeout = setTimeout(() => {
      const { firstPaint, firstContentfulPaint } = getPaintMetrics();
      setMetrics(prev => ({
        ...prev,
        firstPaint,
        firstContentfulPaint
      }));
    }, 100);

    // Enhanced memory usage tracking
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        setMetrics(prev => {
          const currentHeapSize = performance.memory.usedJSHeapSize / (1024 * 1024);
          const totalHeapSize = performance.memory.totalJSHeapSize / (1024 * 1024);
          const newMemoryHistory = [...prev.memoryHistory, currentHeapSize].slice(-10);
          const memoryUsagePercent = (currentHeapSize / totalHeapSize) * 100;
          
          // Calculate memory growth rate over the last 10 samples
          const memoryGrowthRate = newMemoryHistory.length > 1 
            ? ((newMemoryHistory[newMemoryHistory.length - 1] - newMemoryHistory[0]) 
               / newMemoryHistory.length) * (1000 / 2000) // Convert to MB/s
            : 0;

          // Detect if GC might be needed
          const gcSuggested = memoryUsagePercent > 90 || memoryGrowthRate > THRESHOLDS.MEMORY_GROWTH;
          
          if (gcSuggested && !prev.gcSuggested) {
            console.warn('[Performance] High memory usage detected. Consider manual GC or checking for memory leaks.');
          }

          return {
            ...prev,
            jsHeapSize: currentHeapSize,
            totalJSHeapSize: totalHeapSize,
            memoryHistory: newMemoryHistory,
            memoryPeak: Math.max(prev.memoryPeak, currentHeapSize),
            gcSuggested
          };
        });
      }
    }, 2000);

    // Track HMR updates using Vite's hot module
    if (import.meta.hot) {
      let updateStartTime;
      let updateTimeout;

      import.meta.hot.on('vite:beforeUpdate', (data) => {
        updateStartTime = performance.now();
        console.log('[HMR] Update starting...', data);

        // Set a timeout to detect hung updates
        updateTimeout = setTimeout(() => {
          console.warn('[HMR] Update taking longer than expected (>5s)');
        }, 5000);
      });

      import.meta.hot.on('vite:afterUpdate', () => {
        clearTimeout(updateTimeout);
        const updateDuration = performance.now() - updateStartTime;
        
        setMetrics(prev => {
          const newReloadCount = prev.reloadCount + 1;
          const newAverageTime = ((prev.averageReloadTime * prev.reloadCount) + updateDuration) / newReloadCount;

          return {
            ...prev,
            lastReloadTime: updateDuration,
            averageReloadTime: newAverageTime,
            reloadCount: newReloadCount,
            componentUpdates: prev.componentUpdates + 1,
            lastUpdateTimestamp: Date.now(),
            isFirstLoad: false
          };
        });

        console.log(`[HMR] Update completed in ${formatTime(updateDuration)}`);
      });

      import.meta.hot.on('vite:error', (error) => {
        clearTimeout(updateTimeout);
        console.error('[HMR] Update failed:', error);
        setMetrics(prev => ({
          ...prev,
          failedReloads: prev.failedReloads + 1
        }));
      });
    }

    // Cleanup
    return () => {
      clearTimeout(paintMetricsTimeout);
      clearInterval(memoryInterval);
      if (import.meta.hot) {
        import.meta.hot.off('vite:beforeUpdate');
        import.meta.hot.off('vite:afterUpdate');
        import.meta.hot.off('vite:error');
      }
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  const timeSinceLastUpdate = Date.now() - metrics.lastUpdateTimestamp;
  const isStale = !metrics.isFirstLoad && timeSinceLastUpdate > 30000; // 30 seconds
  const memoryUsagePercent = (metrics.jsHeapSize / metrics.totalJSHeapSize) * 100;
  const memoryTrend = metrics.memoryHistory.length > 1 
    ? metrics.memoryHistory[metrics.memoryHistory.length - 1] - metrics.memoryHistory[metrics.memoryHistory.length - 2]
    : 0;

  const memoryGrowthRate = metrics.memoryHistory.length > 1
    ? ((metrics.memoryHistory[metrics.memoryHistory.length - 1] - metrics.memoryHistory[0]) 
       / metrics.memoryHistory.length) * (1000 / 2000)
    : 0;

  const memorySuggestions = getMemoryOptimizationSuggestions(metrics);

  // Minimized view when collapsed
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-0 right-0 m-4 p-2 bg-white rounded-lg shadow-lg text-sm font-mono z-50 hover:bg-gray-50 flex items-center gap-2"
      >
        <span className={`w-2 h-2 rounded-full ${
          metrics.failedReloads > 0 ? 'bg-red-500' :
          metrics.isFirstLoad ? 'bg-blue-500' :
          isStale ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
        <span className="text-xs">Metrics</span>
      </button>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-0 right-0 m-4 p-3 bg-white rounded-lg shadow-lg text-xs font-mono z-50 w-[250px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-xs">Dev Metrics</h3>
        <div className="flex items-center gap-1">
          {metrics.failedReloads > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
              {metrics.failedReloads}!
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            metrics.isFirstLoad 
              ? 'bg-blue-100 text-blue-800'
              : isStale 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
          }`}>
            {metrics.isFirstLoad ? 'Initial' : isStale ? 'Stale' : 'Live'}
          </span>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Minimize"
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-3 text-[11px]">
        {/* Page Load */}
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
            <span>Page Load</span>
            <span>{formatTime(metrics.initialLoadTime)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <p className={getPerformanceIndicator(metrics.domContentLoaded, THRESHOLDS.DOM_READY)}>
              DOM: {formatTime(metrics.domContentLoaded)}
            </p>
            <p className={getPerformanceIndicator(metrics.firstPaint, THRESHOLDS.PAINT)}>
              Paint: {formatTime(metrics.firstPaint)}
            </p>
          </div>
        </div>

        {/* HMR Stats */}
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
            <span>Hot Reload</span>
            <span>{metrics.reloadCount} updates</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <p className={getPerformanceIndicator(metrics.lastReloadTime, THRESHOLDS.HMR)}>
              Last: {formatTime(metrics.lastReloadTime)}
            </p>
            <p className={getPerformanceIndicator(metrics.averageReloadTime, THRESHOLDS.HMR)}>
              Avg: {formatTime(metrics.averageReloadTime)}
            </p>
          </div>
        </div>

        {/* Memory */}
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
            <span>Memory</span>
            <span className={getPerformanceIndicator(memoryUsagePercent, THRESHOLDS.MEMORY_USAGE)}>
              {memoryUsagePercent.toFixed(1)}% used
              {memoryTrend !== 0 && (
                <span className={memoryTrend > 0 ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                  {memoryTrend > 0 ? '↑' : '↓'}
                </span>
              )}
            </span>
          </div>
          <div className="space-y-0.5">
            <p>Heap: {formatBytes(metrics.jsHeapSize * 1024 * 1024)}</p>
            <p>Peak: {formatBytes(metrics.memoryPeak * 1024 * 1024)}</p>
          </div>
        </div>

        {/* Components */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
            <span>Components</span>
            <span>{metrics.componentUpdates} updates</span>
          </div>
          <p className={getPerformanceIndicator(timeSinceLastUpdate, { good: 5000, warning: 15000 })}>
            Last update: {formatTime(timeSinceLastUpdate)} ago
          </p>
        </div>

        {/* Memory Warnings */}
        {memorySuggestions.length > 0 && (
          <div className="mt-2 p-1.5 bg-red-50 rounded text-[10px] text-red-600 space-y-0.5 border border-red-100">
            {memorySuggestions.map((suggestion, index) => (
              <p key={index}>{suggestion}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceMonitor; 