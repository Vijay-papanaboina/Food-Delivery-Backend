/**
 * Domain Validation Utility
 * Ensures users can only authenticate from frontends matching their role
 */

/**
 * Extract origin from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - Origin URL or null if not found
 */
export const extractOrigin = (req) => {
  // Try Origin header first (most reliable for CORS requests)
  if (req.headers.origin) {
    return req.headers.origin;
  }

  // Fallback to Referer header
  if (req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      return url.origin;
    } catch (error) {
      console.warn("Failed to parse referer header:", req.headers.referer);
    }
  }

  return null;
};

/**
 * Map domain to expected role
 * @param {string} origin - Origin URL (e.g., "http://customers.food-delivery.local")
 * @returns {string|null} - Expected role or null if not a known domain
 */
export const mapDomainToRole = (origin) => {
  if (!origin) return null;

  // Get domain-to-role mapping from environment variables
  const domainRoleMap = {};

  if (process.env.CUSTOMER_DOMAIN) {
    domainRoleMap[process.env.CUSTOMER_DOMAIN] = "customer";
  }
  if (process.env.RESTAURANT_DOMAIN) {
    domainRoleMap[process.env.RESTAURANT_DOMAIN] = "restaurant";
  }
  if (process.env.DELIVERY_DOMAIN) {
    domainRoleMap[process.env.DELIVERY_DOMAIN] = "driver";
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return domainRoleMap[hostname] || null;
  } catch (error) {
    console.warn("Failed to parse origin:", origin);
    return null;
  }
};

/**
 * Check if domain matches user role
 * @param {Object} req - Express request object
 * @param {string} userRole - User's role from database
 * @returns {boolean} - True if domain matches role or if validation should be skipped
 */
export const validateDomainForRole = (req, userRole) => {
  // Only validate in production
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const origin = extractOrigin(req);

  // If we can't determine origin, block in production for security
  if (!origin) {
    console.error(
      "Could not extract origin from request in production, blocking"
    );
    return false;
  }

  const expectedRole = mapDomainToRole(origin);

  // If origin is not a known food-delivery domain, block in production
  if (!expectedRole) {
    console.error(`Blocked unknown domain in production: ${origin}`);
    return false;
  }

  // Check if domain matches user role
  return expectedRole === userRole;
};
