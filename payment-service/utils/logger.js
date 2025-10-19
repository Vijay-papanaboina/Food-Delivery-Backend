export function createLogger(serviceName) {
  return {
    info: (message, meta = {}) => {
      console.log(`[${serviceName}] ${message}`, meta);
    },
    error: (message, meta = {}) => {
      console.error(`[${serviceName}] ${message}`, meta);
    },
    warn: (message, meta = {}) => {
      console.warn(`[${serviceName}] ${message}`, meta);
    },
    debug: (message, meta = {}) => {
      console.debug(`[${serviceName}] ${message}`, meta);
    },
  };
}
