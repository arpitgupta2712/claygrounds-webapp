/**
 * Error severity levels
 * @enum {string}
 */
export const ErrorSeverity = {
    INFO: 'info',          // General information, not critical
    WARNING: 'warning',    // Potential issues, functionality continues
    ERROR: 'error',        // Significant issues, feature may not work correctly
    CRITICAL: 'critical'   // System-critical failures
  };
  
  /**
   * Error categories for better organization
   * @enum {string}
   */
  export const ErrorCategory = {
    AUTH: 'authentication', // Authentication related errors
    DATA: 'data',           // Data loading, parsing, processing errors
    UI: 'user_interface',   // UI rendering errors
    NETWORK: 'network',     // Network request errors
    STORAGE: 'storage',     // Local storage errors
    VALIDATION: 'validation', // Data validation errors
    STATE: 'state'          // State management errors
  };