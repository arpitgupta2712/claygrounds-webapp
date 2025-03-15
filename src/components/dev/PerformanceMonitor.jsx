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

  // Calculate memory growth rate for the warning
  const memoryGrowthRate = metrics.memoryHistory.length > 1
    ? ((metrics.memoryHistory[metrics.memoryHistory.length - 1] - metrics.memoryHistory[0]) 
       / metrics.memoryHistory.length) * (1000 / 2000) // Convert to MB/s
    : 0;

  // Add memory optimization suggestions to the UI
  const memorySuggestions = getMemoryOptimizationSuggestions(metrics);

  return (
    <div className="fixed bottom-0 right-0 m-4 p-4 bg-white rounded-lg shadow-lg text-sm font-mono z-50 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Dev Performance Metrics</h3>
        <div className="flex items-center gap-2">
          {metrics.failedReloads > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
              {metrics.failedReloads} Failed
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded ${
            metrics.isFirstLoad 
              ? 'bg-blue-100 text-blue-800'
              : isStale 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
          }`}>
            {metrics.isFirstLoad ? 'Initial Load' : isStale ? 'Stale Data' : 'Live'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold mb-2 text-gray-500">Page Load</h4>
          <div className="space-y-1">
            <p className={getPerformanceIndicator(metrics.initialLoadTime, THRESHOLDS.INITIAL_LOAD)}>
              Initial: {formatTime(metrics.initialLoadTime)}
            </p>
            <p className={getPerformanceIndicator(metrics.domContentLoaded, THRESHOLDS.DOM_READY)}>
              DOM Ready: {formatTime(metrics.domContentLoaded)}
            </p>
            <p className={getPerformanceIndicator(metrics.firstPaint, THRESHOLDS.PAINT)}>
              Paint: {formatTime(metrics.firstPaint)}
            </p>
            <p className={getPerformanceIndicator(metrics.firstContentfulPaint, THRESHOLDS.CONTENT)}>
              Content: {formatTime(metrics.firstContentfulPaint)}
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold mb-2 text-gray-500">HMR Stats</h4>
          <div className="space-y-1">
            <p className={getPerformanceIndicator(metrics.lastReloadTime, THRESHOLDS.HMR)}>
              Last: {formatTime(metrics.lastReloadTime)}
            </p>
            <p className={getPerformanceIndicator(metrics.averageReloadTime, THRESHOLDS.HMR)}>
              Average: {formatTime(metrics.averageReloadTime)}
            </p>
            <p>Updates: {metrics.reloadCount}</p>
            {metrics.failedReloads > 0 && (
              <p className="text-red-600">Failed: {metrics.failedReloads}</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold mb-2 text-gray-500">Memory</h4>
          <div className="space-y-1">
            <p className={getPerformanceIndicator(memoryUsagePercent, THRESHOLDS.MEMORY_USAGE)}>
              Usage: {memoryUsagePercent.toFixed(1)}%
              {memoryTrend !== 0 && (
                <span className={`ml-2 ${memoryTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {memoryTrend > 0 ? '↑' : '↓'}
                  {memoryGrowthRate > THRESHOLDS.MEMORY_GROWTH && ' (!)'} 
                </span>
              )}
            </p>
            <p>Heap: {formatBytes(metrics.jsHeapSize * 1024 * 1024)} / {formatBytes(metrics.totalJSHeapSize * 1024 * 1024)}</p>
            <p>Peak: {formatBytes(metrics.memoryPeak * 1024 * 1024)}</p>
            {memorySuggestions.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 space-y-1">
                {memorySuggestions.map((suggestion, index) => (
                  <p key={index}>{suggestion}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold mb-2 text-gray-500">Components</h4>
          <div className="space-y-1">
            <p>Updates: {metrics.componentUpdates}</p>
            <p className={getPerformanceIndicator(timeSinceLastUpdate, { good: 5000, warning: 15000 })}>
              Last: {formatTime(timeSinceLastUpdate)} ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor; 