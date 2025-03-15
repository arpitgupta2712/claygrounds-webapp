import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Base modal component with standard modal functionality
 */
function BaseModal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  className = ''
}) {
  const modalRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden animate-fadeUp ${className}`}
      >
        {/* Close button */}
        <button
          className="absolute right-6 top-6 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white bg-transparent hover:bg-primary rounded-full transition-all hover:rotate-90"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="text-2xl font-semibold">&times;</span>
        </button>

        {/* Header */}
        {title && (
          <div className="px-10 pt-10 pb-4 border-b-2 border-primary">
            <h2 className="text-2xl font-semibold text-primary">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-theme(space.20))] p-10 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  className: PropTypes.string
};

export default BaseModal; 