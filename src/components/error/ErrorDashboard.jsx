import { useState, useEffect, useMemo } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';

const severityColors = {
  [ErrorSeverity.INFO]: 'bg-blue-100 text-blue-800',
  [ErrorSeverity.WARNING]: 'bg-yellow-100 text-yellow-800',
  [ErrorSeverity.ERROR]: 'bg-red-100 text-red-800',
  [ErrorSeverity.CRITICAL]: 'bg-red-200 text-red-900'
};

function ErrorDashboard() {
  const { errors, handleError, handleAsync } = useErrorHandler();
  const [filter, setFilter] = useState({
    severity: 'all',
    category: 'all',
    timeRange: '24h'
  });

  // Function to generate test errors
  const generateTestError = async (severity, category) => {
    const errorMessages = {
      [ErrorSeverity.INFO]: 'This is a test info message',
      [ErrorSeverity.WARNING]: 'This is a test warning message',
      [ErrorSeverity.ERROR]: 'This is a test error message',
      [ErrorSeverity.CRITICAL]: 'This is a test critical error message'
    };

    // Simulate an async operation that might fail
    await handleAsync(
      async () => {
        if (severity === ErrorSeverity.CRITICAL) {
          throw new Error(errorMessages[severity]);
        }
        // For non-critical errors, we'll explicitly call handleError
        handleError(
          new Error(errorMessages[severity]),
          {
            severity,
            category,
            metadata: {
              test: true,
              timestamp: new Date().toISOString(),
              source: 'ErrorDashboard'
            }
          }
        );
      },
      {
        severity,
        category,
        rethrow: false,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          source: 'ErrorDashboard'
        }
      }
    );
  };

  // Memoized filtered errors
  const filteredErrors = useMemo(() => {
    let filtered = [...errors];

    // Apply severity filter
    if (filter.severity !== 'all') {
      filtered = filtered.filter(error => error.severity === filter.severity);
    }

    // Apply category filter
    if (filter.category !== 'all') {
      filtered = filtered.filter(error => error.category === filter.category);
    }

    // Apply time range filter
    const now = new Date();
    const timeRangeMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    if (filter.timeRange !== 'all') {
      const timeLimit = now.getTime() - timeRangeMap[filter.timeRange];
      filtered = filtered.filter(error => new Date(error.timestamp).getTime() > timeLimit);
    }

    return filtered;
  }, [errors, filter]);

  // Error statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredErrors.length,
      bySeverity: {},
      byCategory: {},
      trend: {
        lastHour: 0,
        last24Hours: 0,
        last7Days: 0
      }
    };

    const now = new Date();
    filteredErrors.forEach(error => {
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;

      // Calculate trends
      const errorTime = new Date(error.timestamp).getTime();
      if (now.getTime() - errorTime <= 60 * 60 * 1000) stats.trend.lastHour++;
      if (now.getTime() - errorTime <= 24 * 60 * 60 * 1000) stats.trend.last24Hours++;
      if (now.getTime() - errorTime <= 7 * 24 * 60 * 60 * 1000) stats.trend.last7Days++;
    });

    return stats;
  }, [filteredErrors]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Error Dashboard</h1>

      {/* Test Error Generation Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Test Error Generation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => generateTestError(ErrorSeverity.INFO, ErrorCategory.UI)}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Generate Info
          </button>
          <button
            onClick={() => generateTestError(ErrorSeverity.WARNING, ErrorCategory.DATA)}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >
            Generate Warning
          </button>
          <button
            onClick={() => generateTestError(ErrorSeverity.ERROR, ErrorCategory.NETWORK)}
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Generate Error
          </button>
          <button
            onClick={() => generateTestError(ErrorSeverity.CRITICAL, ErrorCategory.SECURITY)}
            className="px-4 py-2 bg-red-200 text-red-900 rounded hover:bg-red-300"
          >
            Generate Critical
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Error Counts</h3>
          <div className="space-y-2">
            <p>Total: {statistics.total}</p>
            <p>Last Hour: {statistics.trend.lastHour}</p>
            <p>Last 24 Hours: {statistics.trend.last24Hours}</p>
            <p>Last 7 Days: {statistics.trend.last7Days}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">By Severity</h3>
          <div className="space-y-2">
            {Object.entries(statistics.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex justify-between">
                <span className={`px-2 py-1 rounded ${severityColors[severity]}`}>
                  {severity}
                </span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">By Category</h3>
          <div className="space-y-2">
            {Object.entries(statistics.byCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between">
                <span>{category}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="border rounded px-3 py-2"
          value={filter.severity}
          onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
        >
          <option value="all">All Severities</option>
          {Object.values(ErrorSeverity).map(severity => (
            <option key={severity} value={severity}>{severity}</option>
          ))}
        </select>

        <select
          className="border rounded px-3 py-2"
          value={filter.category}
          onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="all">All Categories</option>
          {Object.values(ErrorCategory).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          className="border rounded px-3 py-2"
          value={filter.timeRange}
          onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value }))}
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Error List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Context
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredErrors.map((error) => (
              <tr key={error.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(error.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${severityColors[error.severity]}`}>
                    {error.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {error.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {error.message}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {error.context}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ErrorDashboard; 