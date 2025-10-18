import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { createUser, getUserByEmail } from "../repositories/user.repo.js";
import { generateTokens } from "../config/jwt.js";
// No Kafka events needed for user service

export const signup = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Publish user created event AFTER database insert
    // User created successfully

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
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
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: "Account is deactivated",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    res.json({
      message: "Login successful",
      user: userResponse,
      accessToken,
      refreshToken,
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Refresh token required",
      });
    }

    // Verify refresh token
    const { verifyToken } = await import("../config/jwt.js");
    const decoded = verifyToken(refreshToken, true);

    // Generate new tokens
    const { generateTokens } = await import("../config/jwt.js");
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.json({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

export const validateToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (middleware already verified)
    res.json({
      message: "Token is valid",
      user: req.user,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
