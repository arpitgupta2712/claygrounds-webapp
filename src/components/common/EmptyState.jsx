import PropTypes from 'prop-types';

/**
 * EmptyState component for displaying when no data is available
 * @param {Object} props - Component props
 * @param {string} props.title - Empty state title
 * @param {string} props.message - Empty state message
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {React.ReactNode} props.action - Action button or component
 * @param {string} props.className - Additional CSS classes
 */
function EmptyState({ 
  title = 'No data available', 
  message = 'There are no items to display at this time.', 
  icon,
  action,
  className = ''
}) {
  return (
    <div className={`py-8 px-4 text-center bg-white rounded-lg shadow-sm ${className}`}>
      {/* Icon */}
      {icon ? (
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
      ) : (
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      
      {/* Message */}
      <p className="text-gray-600 max-w-md mx-auto mb-6">{message}</p>
      
      {/* Action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string
};

// Predefined empty state variants
EmptyState.Search = (props) => (
  <EmptyState
    title="No results found"
    message="We couldn't find any results matching your search. Try adjusting your search terms or filters."
    icon={
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    }
    {...props}
  />
);

EmptyState.Filter = (props) => (
  <EmptyState
    title="No matching data"
    message="No items match your current filter criteria. Try adjusting your filters to see more results."
    icon={
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </div>
    }
    {...props}
  />
);

EmptyState.Error = (props) => (
  <EmptyState
    title="Error loading data"
    message="There was a problem loading the data. Please try again or contact support if the issue persists."
    icon={
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-light text-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    }
    {...props}
  />
);

EmptyState.NoAccess = (props) => (
  <EmptyState
    title="Access restricted"
    message="You don't have permission to access this data. Contact your administrator if you need access."
    icon={
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    }
    {...props}
  />
);

export default EmptyState;