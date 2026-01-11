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
import { requireInternalKey } from "../middleware/internalAuth.js";
import {
  validateUpdateProfile,
  validateAddress,
} from "../middleware/validation.js";

export default function userRoutes(serviceName) {
  const router = Router();

  // Protected user profile routes (customer role only)
  router.get(
    "/users/profile",
    authenticateToken,
    requireRole("customer"),
    getProfile
  );
  router.put(
    "/users/profile",
    authenticateToken,
    requireRole("customer"),
    validateUpdateProfile,
    updateProfile
  );
  router.delete(
    "/users/profile",
    authenticateToken,
    requireRole("customer"),
    deleteProfile
  );

  // Protected address routes (customer role only)
  router.get(
    "/users/addresses",
    authenticateToken,
    requireRole("customer"),
    getAddresses
  );
  router.post(
    "/users/addresses",
    authenticateToken,
    requireRole("customer"),
    validateAddress,
    addAddress
  );
  router.put(
    "/users/addresses/:id",
    authenticateToken,
    requireRole("customer"),
    validateAddress,
    updateAddressById
  );
  router.delete(
    "/users/addresses/:id",
    authenticateToken,
    requireRole("customer"),
    deleteAddressById
  );
  router.put(
    "/users/addresses/:id/default",
    authenticateToken,
    requireRole("customer"),
    setDefaultAddressById
  );

  // Internal-only route for inter-service communication
  // Protected by API key - only other microservices can call this
  router.get("/users/:id", requireInternalKey, getUserByIdController);

  return router;
}
