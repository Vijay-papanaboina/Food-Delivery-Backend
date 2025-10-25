import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { createUser, getUserByEmail } from "../repositories/user.repo.js";
import { generateTokens } from "../config/jwt.js";
import { logger } from "../utils/logger.js";
import { validateDomainForRole } from "../utils/domainValidator.js";

// No Kafka events needed for user service

export const signup = async (req, res) => {
  try {
    // Check validation errors
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

    const { name, email, phone, password } = req.body;

    logger.info("User signup attempt", {
      email,
      name,
      hasPhone: !!phone,
    });

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      logger.warn("Signup failed - user already exists", {
        email,
      });
      return res.status(409).json({
        error: "User already exists with this email",
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (let database generate userId)
    const user = await createUser({
      name,
      email,
      phone,
      passwordHash,
    });

    // Generate tokens (minimal payload)
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info("User signup successful", {
      userId: user.id,
      email: user.email,
    });

    // Publish user created event AFTER database insert
    // User created successfully

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    logger.error("Signup failed", {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
    });
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    // Check validation errors
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
    const { role: requiredRole } = req.params; // Get role from URL parameter

    logger.info("User login attempt", {
      email,
      requiredRole: requiredRole || "any",
    });

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      logger.warn("Login failed - user not found", {
        email,
      });
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn("Login failed - account deactivated", {
        userId: user.id,
        email,
      });
      return res.status(401).json({
        error: "Account is deactivated",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      logger.warn("Login failed - invalid password", {
        userId: user.id,
        email,
      });
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Validate domain matches user role (production only)
    const isDomainValid = validateDomainForRole(req, user.role);
    if (!isDomainValid) {
      // Return same error as invalid password to not leak user existence
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      logger.warn("Login failed - role mismatch", {
        userId: user.id,
        email,
        userRole: user.role,
        requiredRole,
      });
      return res.status(403).json({
        error: `Access denied. This login is restricted to ${requiredRole} users only.`,
      });
    }

    // Generate tokens (minimal payload)
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info("User login successful", {
      userId: user.id,
      email: user.email,
      role: user.role,
      requiredRole: requiredRole || "any",
    });

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.log("No refresh token found in cookies");
      return res.status(401).json({
        error: "Refresh token required",
      });
    }

    // Verify refresh token
    const { verifyToken } = await import("../config/jwt.js");
    const decoded = verifyToken(refreshToken, true);

    // Get fresh user data from database
    const { getUserById } = await import("../repositories/user.repo.js");
    const user = await getUserById(decoded.userId);

    if (!user) {
      logger.warn("User not found during token refresh", {
        userId: decoded.userId,
      });
      return res.status(401).json({
        error: "User not found",
      });
    }

    // Validate domain matches user role (production only)
    const isDomainValid = validateDomainForRole(req, user.role);
    if (!isDomainValid) {
      logger.warn("Token refresh failed - domain does not match user role", {
        userId: user.id,
        userRole: user.role,
        origin: req.headers.origin || req.headers.referer,
      });
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Generate new access token only (keep same refresh token)
    const { generateTokens } = await import("../config/jwt.js");
    const { accessToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password hash from user response
    const { passwordHash: _, ...userResponse } = user;

    res.json({
      message: "Token refreshed successfully",
      accessToken,
      user: userResponse,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    // Clear the invalid refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

export const validateToken = async (req, res) => {
  try {
    // Get fresh user data from database (req.user only has JWT payload)
    const { getUserById } = await import("../repositories/user.repo.js");
    const user = await getUserById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    // Validate domain matches user role (production only)
    const isDomainValid = validateDomainForRole(req, user.role);
    if (!isDomainValid) {
      logger.warn("Token validation failed - domain does not match user role", {
        userId: user.id,
        userRole: user.role,
        origin: req.headers.origin || req.headers.referer,
      });
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Remove password hash from user response
    const { passwordHash: _, ...userResponse } = user;

    res.json({
      message: "Token is valid",
      user: userResponse,
    });
  } catch (error) {
    console.error("Token validation error:", error);
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

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info("User logout successful", {
      userId: req.user?.userId,
      email: req.user?.email,
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
