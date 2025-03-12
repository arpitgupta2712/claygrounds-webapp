import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Toast component
const Toast = ({ message, type = 'info', onClose }) => {
  const typeClasses = {
    info: 'bg-info-light text-info border-info',
    success: 'bg-success-light text-success border-success',
    warning: 'bg-warning-light text-warning border-warning',
    error: 'bg-error-light text-error border-error'
  };
  
  const classes = typeClasses[type] || typeClasses.info;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return createPortal(
    <div className={`fixed bottom-4 left-4 max-w-xs p-3 rounded shadow-md border-l-4 ${classes} animate-fadeIn`}>
      <div className="flex justify-between items-center">
        <p className="pr-4">{message}</p>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>,
    document.body
  );
};

// Custom hook for toast notifications
export function useToast() {
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);
  
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);
  
  return {
    showToast,
    hideToast,
    toast,
    ToastDisplay: toast ? (
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={hideToast} 
      />
    ) : null
  };
}

// Toast component for direct import
export function ToastContainer() {
  const { toast, hideToast } = useToast();
  
  if (!toast) return null;
  
  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  );
}