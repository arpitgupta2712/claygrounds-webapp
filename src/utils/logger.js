// Log levels
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Log categories
export const LogCategory = {
  AUTH: 'auth',
  DATA: 'data',
  UI: 'ui',
  PERF: 'performance',
  STATE: 'state'
};

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR;
    this.enabledCategories = new Set(Object.values(LogCategory));
    
    // Allow override via localStorage
    try {
      const storedLevel = localStorage.getItem('log_level');
      if (storedLevel) this.level = parseInt(storedLevel);
      
      const storedCategories = localStorage.getItem('log_categories');
      if (storedCategories) {
        this.enabledCategories = new Set(JSON.parse(storedCategories));
      }
    } catch (e) {
      console.warn('Failed to load logger preferences from localStorage');
    }
  }

  setLevel(level) {
    this.level = level;
    try {
      localStorage.setItem('log_level', level.toString());
    } catch (e) {
      console.warn('Failed to save log level to localStorage');
    }
  }

  enableCategory(category) {
    this.enabledCategories.add(category);
    this._saveCategories();
  }

  disableCategory(category) {
    this.enabledCategories.delete(category);
    this._saveCategories();
  }

  _saveCategories() {
    try {
      localStorage.setItem('log_categories', JSON.stringify([...this.enabledCategories]));
    } catch (e) {
      console.warn('Failed to save log categories to localStorage');
    }
  }

  _shouldLog(level, category) {
    return level <= this.level && this.enabledCategories.has(category);
  }

  _formatMessage(category, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category.toUpperCase()}]`;
    
    if (data) {
      if (typeof data === 'object') {
        return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
      }
      return `${prefix} ${message}: ${data}`;
    }
    return `${prefix} ${message}`;
  }

  error(category, message, data) {
    if (this._shouldLog(LogLevel.ERROR, category)) {
      console.error(this._formatMessage(category, message, data));
    }
  }

  warn(category, message, data) {
    if (this._shouldLog(LogLevel.WARN, category)) {
      console.warn(this._formatMessage(category, message, data));
    }
  }

  info(category, message, data) {
    if (this._shouldLog(LogLevel.INFO, category)) {
      console.info(this._formatMessage(category, message, data));
    }
  }

  debug(category, message, data) {
    if (this._shouldLog(LogLevel.DEBUG, category)) {
      console.debug(this._formatMessage(category, message, data));
    }
  }

  trace(category, message, data) {
    if (this._shouldLog(LogLevel.TRACE, category)) {
      console.debug(this._formatMessage(category, message, data));
    }
  }

  // Performance logging helper
  perf(label, data) {
    this.debug(LogCategory.PERF, label, data);
  }
}

// Create singleton instance
export const logger = new Logger();

// Development helper to expose logger controls to console
if (process.env.NODE_ENV === 'development') {
  window.logger = logger;
  console.info(`
Logger available in console as 'logger':
- logger.setLevel(LogLevel.INFO)
- logger.enableCategory('auth')
- logger.disableCategory('auth')
  `);
}

export default logger; 