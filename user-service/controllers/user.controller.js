import { validationResult } from "express-validator";
import {
  getProfileService,
  getUserByIdService,
  updateProfileService,
  deleteProfileService,
  getAddressesService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from "../services/user.service.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getProfileService(userId);

    res.json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);

    res.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
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

    const user = await updateProfileService(req.user.userId, updateData);

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const result = await deleteProfileService(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error("Delete profile error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await getAddressesService(req.user.userId);
    res.json({
      message: "Addresses retrieved successfully",
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const address = await addAddressService(req.user.userId, req.body);

    res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Add address error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateAddressById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const address = await updateAddressService(req.user.userId, id, req.body);

    res.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAddressService(req.user.userId, id);
    res.json(result);
  } catch (error) {
    console.error("Delete address error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const setDefaultAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await setDefaultAddressService(req.user.userId, id);

    res.json({
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set default address error:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({
      error: "Internal server error",
    });
  }
};