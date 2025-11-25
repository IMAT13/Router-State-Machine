const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_METHODS = {
  [LOG_LEVELS.ERROR]: console.error,
  [LOG_LEVELS.WARN]: console.warn,
  [LOG_LEVELS.INFO]: console.info,
  [LOG_LEVELS.DEBUG]: console.debug,
};

class Logger {
  constructor(options = {}) {
    this.level = options.debug === false ? LOG_LEVELS.ERROR : options.level || LOG_LEVELS.INFO;
    this.prefix = options.prefix || "[StateMachine]";
    this.enabled = options.debug !== false;
  }

  updateConfig(options = {}) {
    if (options.debug !== undefined) {
      this.level = options.debug === false ? LOG_LEVELS.ERROR : options.level || LOG_LEVELS.INFO;
    }
    if (options.prefix !== undefined) {
      this.prefix = options.prefix;
    }
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
    }
  }

  _log(level, message, data = null) {
    if (!this.enabled || level > this.level) return;

    const logMessage = `${this.prefix} ${message}`;
    const logMethod = LOG_METHODS[level];

    if (logMethod) {
      logMethod(logMessage, data || "");
    }
  }

  error(message, data = null) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = null) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = null) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }
}

export default Logger;
