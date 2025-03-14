import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Tooltip component for displaying hover information
 */
const Tooltip = memo(function Tooltip({ content, children }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        {content}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </div>
  );
});

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired
};

export default Tooltip; 