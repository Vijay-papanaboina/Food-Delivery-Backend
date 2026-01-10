import bcrypt from "bcrypt";
import { createUser, getUserByEmail, getUserById } from "../repositories/user.repo.js";
import { generateTokens, verifyToken } from "../config/jwt.js";
import { logger } from "../utils/logger.js";
import { transformUser } from "../utils/dataTransformation.js";

export const signupService = async (userData) => {
  const { name, email, phone, password } = userData;

  logger.info("User signup attempt", {
    email,
    name,
    hasPhone: !!phone,
  });

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    const error = new Error("User already exists with this email");
    error.statusCode = 409;
    throw error;
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
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  logger.info("User signup successful", {
    userId: user.id,
    email: user.email,
  });

  return {
    message: "User created successfully",
    user: transformUser(user),
    accessToken,
    refreshToken,
  };
};

export const loginService = async (email, password, requiredRole) => {
  logger.info("User login attempt", {
    email,
    requiredRole: requiredRole || "any",
  });

  // Get user by email
  const user = await getUserByEmail(email);
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check if user is active
  if (!user.isActive) {
    const error = new Error("Account is deactivated");
    error.statusCode = 401;
    throw error;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    const error = new Error(`Access denied. This login is restricted to ${requiredRole} users only.`);
    error.statusCode = 403;
    throw error;
  }

  // Generate tokens (minimal payload)
  const { accessToken, refreshToken } = generateTokens({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  logger.info("User login successful", {
    userId: user.id,
    email: user.email,
    role: user.role,
    requiredRole: requiredRole || "any",
  });

  return {
    message: "Login successful",
    user: transformUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (token) => {
  if (!token) {
    const error = new Error("Refresh token required");
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify refresh token
    const decoded = verifyToken(token, true);

    // Get fresh user data from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    // Generate new access token only (keep same refresh token)
    const { accessToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: "Token refreshed successfully",
      accessToken,
      user: transformUser(user),
    };
  } catch (error) {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }
};

export const validateTokenService = async (userId) => {
  // Get fresh user data from database
  const user = await getUserById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
  }

  return {
    message: "Token is valid",
    user: transformUser(user),
  };
};
