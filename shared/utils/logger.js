import winston from "winston";

/**
 * Creates a winston logger for backend microservices
 * @param {string} serviceName - Name of the service (e.g., 'order-service')
 * @returns {winston.Logger} Configured logger instance
 */
export function createLogger(serviceName) {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.printf(({ message, ...meta }) => {
        const metaStr =
          Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `[${serviceName}] ${message}${metaStr}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ message, ...meta }) => {
            const metaStr =
              Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
            return `[${serviceName}] ${message}${metaStr}`;
          })
        ),
      }),
    ],
  });
}

/**
 * Helper function to sanitize sensitive data before logging
 * @param {object} data - Data object to sanitize
 * @returns {object} Sanitized data object
 */
export function sanitizeForLogging(data) {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
  ];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
