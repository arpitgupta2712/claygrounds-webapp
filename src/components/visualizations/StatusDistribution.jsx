import { useState } from 'react';
import BaseChart from './BaseChart';

/**
 * StatusDistribution component for visualizing booking status distribution
 * @param {Object} props - Component props
 * @param {Object} props.data - Status distribution data
 * @param {string} props.className - Additional CSS classes
 */
function StatusDistribution({ data, className = '' }) {
  const [chartType, setChartType] = useState('doughnut');

  if (!data || !data.statusStats) return null;

  const { confirmed, cancelled } = data.statusStats;
  const total = data.totalBookings;

  const chartData = {
    labels: ['Confirmed', 'Cancelled'],
    datasets: [
      {
        data: [confirmed, cancelled],
        backgroundColor: [
          'rgba(72, 187, 120, 0.8)',   // Green for Confirmed
          'rgba(245, 101, 101, 0.8)',   // Red for Cancelled
        ],
        borderColor: [
          'rgb(72, 187, 120)',
          'rgb(245, 101, 101)',
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            const { labels, datasets } = data;
            const total = datasets[0].data.reduce((sum, value) => sum + value, 0);
            
            return labels.map((label, i) => ({
              text: `${label} - ${datasets[0].data[i]} (${Math.round((datasets[0].data[i] / total) * 100)}%)`,
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].borderColor[i],
              lineWidth: 1,
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} bookings (${percentage}%)`;
          }
        }
      }
    }
  };

  // Additional options for doughnut chart
  const doughnutOptions = {
    ...options,
    cutout: '60%'
  };

  // Additional options for bar chart
  const barOptions = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toLocaleString()
        }
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Booking Status Distribution</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chartType === 'doughnut'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Donut Chart
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chartType === 'bar'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      <BaseChart
        data={chartData}
        type={chartType}
        options={chartType === 'doughnut' ? doughnutOptions : barOptions}
        className="bg-white p-4 rounded-lg shadow"
      />

      {/* Summary Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2">Status</th>
              <th className="text-right py-2">Bookings</th>
              <th className="text-right py-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-green-600">Confirmed</td>
              <td className="text-right">{confirmed.toLocaleString()}</td>
              <td className="text-right">{Math.round((confirmed / total) * 100)}%</td>
            </tr>
            <tr>
              <td className="py-2 text-red-600">Cancelled</td>
              <td className="text-right">{cancelled.toLocaleString()}</td>
              <td className="text-right">{Math.round((cancelled / total) * 100)}%</td>
            </tr>
            <tr className="font-semibold border-t">
              <td className="py-2">Total</td>
              <td className="text-right">{total.toLocaleString()}</td>
              <td className="text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatusDistribution; 