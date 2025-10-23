import { validationResult } from "express-validator";
import {
  getUserById,
  updateUser,
  deleteUser,
  createAddress,
  getAddressesByUserId,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
} from "../repositories/user.repo.js";
import { logger } from "../utils/logger.js";
// No Kafka events needed for user service

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info("Getting user profile", { userId });

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    // Debug logging
    console.log("[getProfile] User data from DB:", user);
    console.log("[getProfile] User response:", userResponse);

    res.json({
      message: "Profile retrieved successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get user by ID (for inter-service communication)
export const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Getting user by ID", { userId: id });

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    res.json({
      message: "User retrieved successfully",
      user: userResponse,
    });
  } catch (error) {
    logger.error("Get user by ID error", { error: error.message });
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { name, phone } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await updateUser(req.user.userId, updateData);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Publish user updated event AFTER database update
    // User updated successfully

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    await deleteUser(userId);

    // Publish user deleted event AFTER database delete
    // User deleted successfully

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Address management
export const getAddresses = async (req, res) => {
  try {
    const addresses = await getAddressesByUserId(req.user.userId);
    res.json({
      message: "Addresses retrieved successfully",
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { label, street, city, state, zipCode, isDefault } = req.body;

    // If this is being set as default, unset other defaults first
    if (isDefault) {
      await setDefaultAddress(null, req.user.userId); // This will unset all defaults
    }

    const address = await createAddress({
      userId: req.user.userId,
      label,
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
    });

    // Publish address created event AFTER database insert
    // Address created successfully

    res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateAddressById = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { label, street, city, state, zipCode, isDefault } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(id, req.user.userId);
    if (!existingAddress) {
      return res.status(404).json({
        error: "Address not found",
      });
    }

    // If this is being set as default, unset other defaults first
    if (isDefault) {
      await setDefaultAddress(null, req.user.userId); // This will unset all defaults
    }

    const address = await updateAddress(id, req.user.userId, {
      label,
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
    });

    // Publish address updated event AFTER database update
    // Address updated successfully

    res.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(id, req.user.userId);
    if (!existingAddress) {
      return res.status(404).json({
        error: "Address not found",
      });
    }

    await deleteAddress(id, req.user.userId);

    // Publish address deleted event AFTER database delete
    // Address deleted successfully

    res.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const setDefaultAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(id, req.user.userId);
    if (!existingAddress) {
      return res.status(404).json({
        error: "Address not found",
      });
    }

    const address = await setDefaultAddress(id, req.user.userId);

    res.json({
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
