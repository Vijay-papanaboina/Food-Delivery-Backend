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
} from "../repositories/user.repo.js";
import { logger } from "../utils/logger.js";

export const getProfileService = async (userId) => {
  logger.info("Getting user profile", { userId });

  const user = await getUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Remove password hash from response
  const { passwordHash: _, ...userResponse } = user;

  return userResponse;
};

export const getUserByIdService = async (id) => {
  logger.info("Getting user by ID", { userId: id });

  const user = await getUserById(id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Remove password hash from response
  const { passwordHash: _, ...userResponse } = user;

  return userResponse;
};

export const updateProfileService = async (userId, updateData) => {
  const user = await updateUser(userId, updateData);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Remove password hash from response
  const { passwordHash: _, ...userResponse } = user;

  return userResponse;
};

export const deleteProfileService = async (userId) => {
  await deleteUser(userId);
  return { message: "Account deleted successfully" };
};

export const getAddressesService = async (userId) => {
  return await getAddressesByUserId(userId);
};

export const addAddressService = async (userId, addressData) => {
  // If this is being set as default, unset other defaults first
  if (addressData.isDefault) {
    await setDefaultAddress(null, userId); 
  }

  return await createAddress(userId, {
    ...addressData,
    isDefault: addressData.isDefault || false,
  });
};

export const updateAddressService = async (userId, addressId, addressData) => {
  // Check if address exists and belongs to user
  const existingAddress = await getAddressById(addressId, userId);
  if (!existingAddress) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  // If this is being set as default, unset other defaults first
  if (addressData.isDefault) {
    await setDefaultAddress(null, userId);
  }

  const updatedAddress = await updateAddress(addressId, userId, {
    ...addressData,
    isDefault: addressData.isDefault, // Mongoose repo handles undefined
  });
  
  return updatedAddress;
};

export const deleteAddressService = async (userId, addressId) => {
  // Check if address exists and belongs to user
  const existingAddress = await getAddressById(addressId, userId);
  if (!existingAddress) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  await deleteAddress(addressId, userId);
  return { message: "Address deleted successfully" };
};

export const setDefaultAddressService = async (userId, addressId) => {
  // Check if address exists and belongs to user
  const existingAddress = await getAddressById(addressId, userId);
  if (!existingAddress) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  const address = await setDefaultAddress(addressId, userId);
  return address;
};
