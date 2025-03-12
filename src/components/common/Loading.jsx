import PropTypes from 'prop-types';

/**
 * Loading component for showing loading states
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message
 * @param {string} props.size - Size of spinner (sm, md, lg)
 * @param {boolean} props.fullScreen - Whether to display full screen
 * @param {boolean} props.overlay - Whether to display as overlay
 * @param {string} props.className - Additional CSS classes
 */
function Loading({ 
  message = 'Loading data...', 
  size = 'md', 
  fullScreen = false,
  overlay = false,
  className = ''
}) {
  // Determine spinner size
  const spinnerSizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };
  
  const spinnerSize = spinnerSizes[size] || spinnerSizes.md;
  
  // Full screen loading
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-80">
        <div className="text-center">
          <div className={`${spinnerSize} animate-spin rounded-full border-primary border-t-transparent mx-auto`}></div>
          {message && <p className="mt-4 text-text-medium">{message}</p>}
        </div>
      </div>
    );
  }
  
  // Overlay loading
  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-30 bg-white bg-opacity-80">
        <div className="text-center">
          <div className={`${spinnerSize} animate-spin rounded-full border-primary border-t-transparent mx-auto`}></div>
          {message && <p className="mt-4 text-text-medium">{message}</p>}
        </div>
      </div>
    );
  }
  
  // Regular loading indicator
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className={`${spinnerSize} animate-spin rounded-full border-primary border-t-transparent`}></div>
      {message && <p className="mt-4 text-text-medium">{message}</p>}
    </div>
  );
}

Loading.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default Loading;