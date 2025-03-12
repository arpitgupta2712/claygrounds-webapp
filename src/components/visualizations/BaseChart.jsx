import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * BaseChart component that provides common chart functionality
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to visualize
 * @param {string} props.type - Chart type (pie, bar, line, etc.)
 * @param {Object} props.options - Chart.js options
 * @param {string} props.className - Additional CSS classes
 */
function BaseChart({ data, type, options = {}, className = '' }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, options]);

  return (
    <div className={`w-full h-64 ${className}`}>
      <canvas ref={chartRef} />
    </div>
  );
}

export default BaseChart; 