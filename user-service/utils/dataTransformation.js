/**
 * Transform user document to API response format
 * @param {Object} user - The raw user document (lean or Mongoose document)
 * @returns {Object} Transformed user object
 */
export const transformUser = (user) => {
  if (!user) return null;

  // Handle both Mongoose document and lean object
  const userData = user.toObject ? user.toObject() : user;

  return {
    id: userData.id || userData._id,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    role: userData.role,
    isActive: userData.isActive,
    addresses: userData.addresses ? userData.addresses.map(transformAddress) : [],
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
  };
};

/**
 * Transform address subdocument to API response format
 * @param {Object} address - The raw address object
 * @returns {Object} Transformed address object
 */
export const transformAddress = (address) => {
  if (!address) return null;

  return {
    id: address.id || address._id,
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
  };
};
