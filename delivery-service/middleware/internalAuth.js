/**
 * Internal API Key Middleware
 *
 * Protects internal routes that should only be called by other microservices.
 * External users will receive 403 Forbidden if they try to access these routes.
 *
 * Usage:
 *   import { requireInternalKey } from '../middleware/internalAuth.js';
 *   router.post('/internal/endpoint', requireInternalKey, handler);
 *
 * Required Environment Variable:
 *   INTERNAL_API_KEY - Shared secret between all microservices
 */

import { logger } from "../utils/logger.js";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export const requireInternalKey = (req, res, next) => {
  // Skip validation if no key is configured (development fallback)
  if (!INTERNAL_API_KEY) {
    logger.warn("INTERNAL_API_KEY not set - internal routes are unprotected!");
    return next();
  }

  const providedKey = req.headers["x-internal-api-key"];

  if (!providedKey) {
    logger.warn(
      `Internal route accessed without API key: ${req.method} ${req.path}`
    );
    return res.status(403).json({
      error: "Forbidden",
      message: "This endpoint is for internal service communication only",
    });
  }

  if (providedKey !== INTERNAL_API_KEY) {
    logger.warn(`Invalid internal API key provided: ${req.method} ${req.path}`);
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid internal API key",
    });
  }

  next();
};

/**
 * Helper function to get headers for internal API calls
 * Use this when calling other microservices
 *
 * Usage:
 *   fetch(url, { headers: { ...getInternalHeaders() } })
 */
export const getInternalHeaders = () => ({
  "x-internal-api-key": INTERNAL_API_KEY || "",
  "Content-Type": "application/json",
});
