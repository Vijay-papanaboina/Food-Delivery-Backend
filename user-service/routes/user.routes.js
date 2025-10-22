import { Router } from "express";
import {
  getProfile,
  getUserByIdController,
  updateProfile,
  deleteProfile,
  getAddresses,
  addAddress,
  updateAddressById,
  deleteAddressById,
  setDefaultAddressById,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  validateUpdateProfile,
  validateAddress,
} from "../middleware/validation.js";

export default function userRoutes(serviceName) {
  const router = Router();

  // Get user by ID (for inter-service communication - authenticated but no role check)
  router.get("/api/users/:id", authenticateToken, getUserByIdController);

  // Protected user profile routes (customer role only)
  router.get(
    "/api/users/profile",
    authenticateToken,
    requireRole("customer"),
    getProfile
  );
  router.put(
    "/api/users/profile",
    authenticateToken,
    requireRole("customer"),
    validateUpdateProfile,
    updateProfile
  );
  router.delete(
    "/api/users/profile",
    authenticateToken,
    requireRole("customer"),
    deleteProfile
  );

  // Protected address routes (customer role only)
  router.get(
    "/api/users/addresses",
    authenticateToken,
    requireRole("customer"),
    getAddresses
  );
  router.post(
    "/api/users/addresses",
    authenticateToken,
    requireRole("customer"),
    validateAddress,
    addAddress
  );
  router.put(
    "/api/users/addresses/:id",
    authenticateToken,
    requireRole("customer"),
    validateAddress,
    updateAddressById
  );
  router.delete(
    "/api/users/addresses/:id",
    authenticateToken,
    requireRole("customer"),
    deleteAddressById
  );
  router.put(
    "/api/users/addresses/:id/default",
    authenticateToken,
    requireRole("customer"),
    setDefaultAddressById
  );

  return router;
}
