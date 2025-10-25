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
    try {
      const customerUrl = new URL(process.env.CUSTOMER_DOMAIN);
      domainRoleMap[customerUrl.hostname] = "customer";
    } catch (error) {
      console.warn(
        "Failed to parse CUSTOMER_DOMAIN:",
        process.env.CUSTOMER_DOMAIN
      );
    }
  }
  if (process.env.RESTAURANT_DOMAIN) {
    try {
      const restaurantUrl = new URL(process.env.RESTAURANT_DOMAIN);
      domainRoleMap[restaurantUrl.hostname] = "restaurant";
    } catch (error) {
      console.warn(
        "Failed to parse RESTAURANT_DOMAIN:",
        process.env.RESTAURANT_DOMAIN
      );
    }
  }
  if (process.env.DELIVERY_DOMAIN) {
    try {
      const deliveryUrl = new URL(process.env.DELIVERY_DOMAIN);
      domainRoleMap[deliveryUrl.hostname] = "driver";
    } catch (error) {
      console.warn(
        "Failed to parse DELIVERY_DOMAIN:",
        process.env.DELIVERY_DOMAIN
      );
    }
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
  if (process.env.NODE_ENV.toLowerCase() !== "production") {
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
  }

  // Check if domain matches user role
  const isValid = expectedRole === userRole;

  // Extract hostname for logging
  let hostname = null;
  try {
    const url = new URL(origin);
    hostname = url.hostname;
  } catch (error) {
    hostname = origin; // Fallback to origin if parsing fails
  }

  // Always log validation result
  if (isValid) {
    console.log("✅ Domain validation SUCCESS:", {
      origin: origin,
      hostname: hostname,
      userRole: userRole,
      expectedRole: expectedRole,
      envVars: {
        CUSTOMER_DOMAIN: process.env.CUSTOMER_DOMAIN,
        RESTAURANT_DOMAIN: process.env.RESTAURANT_DOMAIN,
        DELIVERY_DOMAIN: process.env.DELIVERY_DOMAIN,
      },
    });
  } else {
    console.error("❌ Domain validation FAILED:", {
      origin: origin,
      hostname: hostname,
      userRole: userRole,
      expectedRole: expectedRole,
      envVars: {
        CUSTOMER_DOMAIN: process.env.CUSTOMER_DOMAIN,
        RESTAURANT_DOMAIN: process.env.RESTAURANT_DOMAIN,
        DELIVERY_DOMAIN: process.env.DELIVERY_DOMAIN,
      },
    });
  }

  return isValid;
};
