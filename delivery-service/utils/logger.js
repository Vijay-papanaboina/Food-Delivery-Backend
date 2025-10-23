import winston from "winston";

const SERVICE_NAME = "delivery-service";

/**
 * Winston logger instance for the delivery service
 */
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr =
        Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
      return `[${SERVICE_NAME}] ${level}: ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true, message: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
          return `[${SERVICE_NAME}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

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
