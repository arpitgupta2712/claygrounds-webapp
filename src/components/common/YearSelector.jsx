import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * YearSelector component for selecting financial year
 * Allows users to switch between different financial years for data viewing
 */
function YearSelector() {
  const { selectedYear, setSelectedYear } = useApp();
  const [years, setYears] = useState([]);

  useEffect(() => {
    // Generate last 5 financial years including current
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push(`${year}${year + 1}`);
    }
    setYears(years);
  }, []);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
        Financial Year
      </label>
      <select
        id="year-select"
        value={selectedYear || ''}
        onChange={handleYearChange}
        className="block w-36 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {`FY ${year.slice(0, 4)}-${year.slice(4, 6)}`}
          </option>
        ))}
      </select>
    </div>
  );
}

export default YearSelector; 