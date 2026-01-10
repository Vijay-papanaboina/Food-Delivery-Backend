import { User } from "../db/schema.js";

// User operations
export const createUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user.toObject();
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const getUserById = async (id) => {
  return await User.findById(id).lean();
};

export const updateUser = async (id, userData) => {
  return await User.findByIdAndUpdate(
    id,
    { $set: userData },
    { new: true, runValidators: true }
  ).lean();
};

export const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
  return true;
};

// Address operations (embedded in user document)
export const createAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  user.addresses.push(addressData);
  await user.save();
  
  return user.addresses[user.addresses.length - 1].toObject();
};

export const getAddressesByUserId = async (userId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) return [];
  
  // Sort by isDefault (true first), then by createdAt
  return user.addresses.sort((a, b) => {
    if (a.isDefault === b.isDefault) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return b.isDefault - a.isDefault;
  });
};

export const getAddressById = async (addressId, userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  
  return user.addresses.id(addressId);
};

export const updateAddress = async (addressId, userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  const address = user.addresses.id(addressId);
  if (!address) throw new Error("Address not found");
  
  Object.assign(address, addressData);
  await user.save();
  
  return address.toObject();
};

export const deleteAddress = async (addressId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  user.addresses.pull(addressId);
  await user.save();
  
  return true;
};

export const setDefaultAddress = async (addressId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  // Unset all default addresses
  user.addresses.forEach((addr) => {
    addr.isDefault = false;
  });
  
  // Set the specified address as default if provided
  if (addressId) {
    const address = user.addresses.id(addressId);
    if (!address) throw new Error("Address not found");
    
    address.isDefault = true;
    await user.save();
    return address.toObject();
  }
  
  await user.save();
  return null;
};

export const getDefaultAddress = async (userId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) return null;
  
  return user.addresses.find((addr) => addr.isDefault);
};
