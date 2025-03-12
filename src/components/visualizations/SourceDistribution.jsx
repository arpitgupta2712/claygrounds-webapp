import { useState } from 'react';
import BaseChart from './BaseChart';

/**
 * SourceDistribution component for visualizing booking source distribution
 * @param {Object} props - Component props
 * @param {Object} props.data - Source distribution data
 * @param {string} props.className - Additional CSS classes
 */
function SourceDistribution({ data, className = '' }) {
  const [chartType, setChartType] = useState('pie');

  if (!data || !data.sourceStats) return null;

  const { online, offline } = data.sourceStats;
  const total = online + offline;
  const onlinePercentage = (online / total) * 100;
  const offlinePercentage = (offline / total) * 100;

  const chartData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [online, offline],
        backgroundColor: [
          'rgba(66, 153, 225, 0.8)',   // Blue for Online
          'rgba(154, 230, 180, 0.8)'    // Green for Offline
        ],
        borderColor: [
          'rgb(66, 153, 225)',
          'rgb(154, 230, 180)'
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
        <h3 className="text-lg font-semibold">Booking Source Distribution</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chartType === 'pie'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Pie Chart
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
        options={chartType === 'bar' ? barOptions : options}
        className="bg-white p-4 rounded-lg shadow"
      />

      {/* Summary Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2">Source</th>
              <th className="text-right py-2">Bookings</th>
              <th className="text-right py-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-blue-600">Online</td>
              <td className="text-right">{online.toLocaleString()}</td>
              <td className="text-right">{Math.round(onlinePercentage)}%</td>
            </tr>
            <tr>
              <td className="py-2 text-green-600">Offline</td>
              <td className="text-right">{offline.toLocaleString()}</td>
              <td className="text-right">{Math.round(offlinePercentage)}%</td>
            </tr>
            <tr className="font-semibold border-t">
              <td className="py-2">Total</td>
              <td className="text-right">{total.toLocaleString()}</td>
              <td className="text-right">100%</td>
            </tr>
          </tbody>
        </table>

        {/* Additional Metrics */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Online Conversion Rate</h4>
            <p className="text-lg font-semibold text-blue-600">
              {Math.round(onlinePercentage)}%
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">Offline Conversion Rate</h4>
            <p className="text-lg font-semibold text-green-600">
              {Math.round(offlinePercentage)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SourceDistribution; 