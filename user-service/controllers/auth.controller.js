import { validationResult } from "express-validator";
import {
  signupService,
  loginService,
  refreshTokenService,
  validateTokenService,
} from "../services/auth.service.js";
import { logger } from "../utils/logger.js";
import {
  validateDomainForRole,
  extractOrigin,
  mapDomainToRole,
} from "../utils/domainValidator.js";

export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Signup validation failed", {
        errors: errors.array(),
      });
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const result = await signupService(req.body);

    // Set refresh token in HTTP-only cookie (Always customer for signup)
    res.cookie("refreshToken_customer", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    logger.error("Signup failed", {
      error: error.message,
      email: req.body?.email,
    });
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Login validation failed", {
        errors: errors.array(),
      });
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;
    const { role: requiredRole } = req.params;

    const result = await loginService(email, password, requiredRole);

    // Validate domain matches user role (production only)
    const isDomainValid = validateDomainForRole(req, result.user.role);
    if (!isDomainValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Set refresh token in HTTP-only cookie with role-specific name
    const cookieName = `refreshToken_${result.user.role}`;
    res.cookie(cookieName, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // Determine which cookie to read based on the domain
    const origin = extractOrigin(req);
    const expectedRole = mapDomainToRole(origin);
    
    if (!expectedRole) {
      logger.warn(`Refresh request from unknown origin: ${origin}`);
      return res.status(401).json({ error: "Unauthorized origin" });
    }

    const cookieName = `refreshToken_${expectedRole}`;
    const token = req.cookies[cookieName];

    if (!token) {
      return res.status(401).json({ error: "No refresh token found" });
    }

    const result = await refreshTokenService(token);
    
    // Validate domain matches user role
    const isDomainValid = validateDomainForRole(req, result.user.role);
    if (!isDomainValid) {
      logger.warn("Token refresh failed - domain does not match user role");
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(result);
  } catch (error) {
    console.error("Refresh token error:", error.message);
    
    // Clear the cookie we tried to use
    const origin = extractOrigin(req);
    const expectedRole = mapDomainToRole(origin);
    if (expectedRole) {
      const cookieName = `refreshToken_${expectedRole}`;
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

export const validateToken = async (req, res) => {
  try {
    const result = await validateTokenService(req.user.userId);

    const isDomainValid = validateDomainForRole(req, result.user.role);
    if (!isDomainValid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(result);
  } catch (error) {
    console.error("Token validation error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    logger.info("User logout request", {
      userId: req.user?.userId,
      email: req.user?.email,
    });

    // Clear cookie based on role (if known) or Origin
    let cookieName = "refreshToken"; // Default fallback
    
    if (req.user?.role) {
      cookieName = `refreshToken_${req.user.role}`;
    } else {
      const origin = extractOrigin(req);
      const role = mapDomainToRole(origin);
      if (role) {
        cookieName = `refreshToken_${role}`;
      }
    }

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error", { error });
    res.status(500).json({
      error: "Internal server error",
    });
  }
};