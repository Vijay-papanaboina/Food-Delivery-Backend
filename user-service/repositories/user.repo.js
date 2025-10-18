import { eq, and } from "drizzle-orm";
import { db } from "../config/db.js";
import { users, userAddresses } from "../db/schema.js";

export const createUser = async (userData) => {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
};

export const getUserByEmail = async (email) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
};

export const getUserById = async (id) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const updateUser = async (id, userData) => {
  const [user] = await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
};

export const deleteUser = async (id) => {
  await db.delete(users).where(eq(users.id, id));
  return true;
};

// Address operations
export const createAddress = async (addressData) => {
  const [address] = await db
    .insert(userAddresses)
    .values(addressData)
    .returning();
  return address;
};

export const getAddressesByUserId = async (userId) => {
  return await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(userAddresses.isDefault, userAddresses.createdAt);
};

export const getAddressById = async (id, userId) => {
  const [address] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
  return address;
};

export const updateAddress = async (id, userId, addressData) => {
  const [address] = await db
    .update(userAddresses)
    .set({ ...addressData, updatedAt: new Date() })
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .returning();
  return address;
};

export const deleteAddress = async (id, userId) => {
  await db
    .delete(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
  return true;
};

export const setDefaultAddress = async (id, userId) => {
  // First, unset all default addresses for this user
  await db
    .update(userAddresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(userAddresses.userId, userId));

  // Then set the specified address as default
  const [address] = await db
    .update(userAddresses)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
    .returning();

  return address;
};

export const getDefaultAddress = async (userId) => {
  const [address] = await db
    .select()
    .from(userAddresses)
    .where(
      and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true))
    );
  return address;
};
