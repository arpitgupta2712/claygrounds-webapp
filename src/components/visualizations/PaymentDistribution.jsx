import { useState } from 'react';
import BaseChart from './BaseChart';

/**
 * PaymentDistribution component for visualizing payment mode distribution
 * @param {Object} props - Component props
 * @param {Object} props.data - Payment distribution data
 * @param {string} props.className - Additional CSS classes
 */
function PaymentDistribution({ data, className = '' }) {
  const [chartType, setChartType] = useState('pie');

  if (!data || !data.paymentStats) return null;

  const { cash, bank, hudle } = data.paymentStats;
  const chartData = {
    labels: ['Cash', 'Bank Transfer', 'Hudle'],
    datasets: [
      {
        data: [
          cash.amount,
          bank.amount,
          hudle.amount
        ],
        backgroundColor: [
          'rgba(255, 159, 64, 0.8)',  // Orange for Cash
          'rgba(54, 162, 235, 0.8)',   // Blue for Bank
          'rgba(75, 192, 192, 0.8)'    // Teal for Hudle
        ],
        borderColor: [
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)'
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
              text: `${label} - ₹${datasets[0].data[i].toLocaleString()} (${Math.round((datasets[0].data[i] / total) * 100)}%)`,
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
            return `₹${value.toLocaleString()} (${percentage}%)`;
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
          callback: (value) => `₹${value.toLocaleString()}`
        }
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Distribution</h3>
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
              <th className="text-left py-2">Payment Mode</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-right py-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">Cash</td>
              <td className="text-right">₹{cash.amount.toLocaleString()}</td>
              <td className="text-right">{Math.round(cash.percentage)}%</td>
            </tr>
            <tr>
              <td className="py-2">Bank Transfer</td>
              <td className="text-right">₹{bank.amount.toLocaleString()}</td>
              <td className="text-right">{Math.round(bank.percentage)}%</td>
            </tr>
            <tr>
              <td className="py-2">Hudle</td>
              <td className="text-right">₹{hudle.amount.toLocaleString()}</td>
              <td className="text-right">{Math.round(hudle.percentage)}%</td>
            </tr>
            <tr className="font-semibold border-t">
              <td className="py-2">Total</td>
              <td className="text-right">
                ₹{(cash.amount + bank.amount + hudle.amount).toLocaleString()}
              </td>
              <td className="text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentDistribution; 