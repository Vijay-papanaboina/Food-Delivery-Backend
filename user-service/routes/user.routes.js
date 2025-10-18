import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
  getAddresses,
  addAddress,
  updateAddressById,
  deleteAddressById,
  setDefaultAddressById,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateUpdateProfile,
  validateAddress,
} from "../middleware/validation.js";

export default function userRoutes(serviceName) {
  const router = Router();

  // Protected user profile routes
  router.get("/api/users/profile", authenticateToken, getProfile);
  router.put(
    "/api/users/profile",
    authenticateToken,
    validateUpdateProfile,
    updateProfile
  );
  router.delete("/api/users/profile", authenticateToken, deleteProfile);

  // Protected address routes
  router.get("/api/users/addresses", authenticateToken, getAddresses);
  router.post(
    "/api/users/addresses",
    authenticateToken,
    validateAddress,
    addAddress
  );
  router.put(
    "/api/users/addresses/:id",
    authenticateToken,
    validateAddress,
    updateAddressById
  );
  router.delete(
    "/api/users/addresses/:id",
    authenticateToken,
    deleteAddressById
  );
  router.put(
    "/api/users/addresses/:id/default",
    authenticateToken,
    setDefaultAddressById
  );

  return router;
}
