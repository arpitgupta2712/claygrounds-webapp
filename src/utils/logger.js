// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level - can be changed at runtime
let currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;

// Prefix for all logs
const LOG_PREFIX = '[Claygrounds]';

export const logger = {
  setLevel(level) {
    currentLogLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  },

  debug(...args) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(LOG_PREFIX, ...args);
    }
  },

  info(...args) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(LOG_PREFIX, ...args);
    }
  },

  warn(...args) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(LOG_PREFIX, ...args);
    }
  },

  error(...args) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(LOG_PREFIX, ...args);
    }
  }
};

// Function to filter Supabase logs
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;

if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => {
    if (!args[0]?.includes?.('supabase')) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  console.debug = (...args) => {
    if (!args[0]?.includes?.('supabase')) {
      originalConsoleDebug.apply(console, args);
    }
  };
}

export default logger; 