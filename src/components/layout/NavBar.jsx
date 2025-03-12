import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * Main Navigation Bar component
 */
function NavBar() {
  const { selectedYear } = useApp();

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'chart-line' },
    { path: '/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/reports', label: 'Reports', icon: 'file-chart-line' },
    { path: '/visualizations', label: 'Visualizations', icon: 'chart-pie' },
    { path: '/settings', label: 'Settings', icon: 'cog' },
  ];

  return (
    <nav className="bg-white py-4 border-b border-gray-200">
      <div className="container mx-auto px-4 flex flex-wrap justify-between items-center">
        {/* Logo and App Name */}
        <div className="flex items-center mb-2 md:mb-0">
          <div className="text-2xl font-bold text-primary">ClayGrounds</div>
          <div className="ml-2 text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded">
            {selectedYear ? `${selectedYear.slice(0, 4)}-${selectedYear.slice(4, 6)}` : 'FY 2024-25'}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-wrap justify-center space-x-1 md:space-x-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md flex items-center transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <i className={`fas fa-${item.icon} mr-2`}></i>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default NavBar; 