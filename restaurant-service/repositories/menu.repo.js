import { and, asc, desc, eq, sql, inArray } from "drizzle-orm";
import { db } from "../config/db.js";
import { menuItems } from "../db/schema.js";

export async function upsertMenuItem(menuItem) {
  const values = {
    restaurantId: menuItem.restaurantId,
    name: menuItem.name,
    description: menuItem.description,
    price: String(menuItem.price),
    category: menuItem.category,
    isAvailable: menuItem.isAvailable,
    preparationTime: menuItem.preparationTime,
    imageUrl: menuItem.imageUrl || null,
    createdAt: menuItem.createdAt ? new Date(menuItem.createdAt) : undefined,
  };

  // Only include id if updating an existing item
  if (menuItem.itemId) {
    values.id = menuItem.itemId;
  }

  await db
    .insert(menuItems)
    .values(values)
    .onConflictDoUpdate({
      target: menuItems.id,
      set: {
        restaurantId: sql`excluded.restaurant_id`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        price: sql`excluded.price`,
        category: sql`excluded.category`,
        isAvailable: sql`excluded.is_available`,
        preparationTime: sql`excluded.preparation_time`,
        imageUrl: sql`excluded.image_url`,
      },
    });
}

export async function getMenuItems(restaurantId, filters = {}) {
  let query = db
    .select({
      item_id: menuItems.id,
      restaurant_id: menuItems.restaurantId,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      category: menuItems.category,
      is_available: menuItems.isAvailable,
      preparation_time: menuItems.preparationTime,
      image_url: menuItems.imageUrl,
      created_at: menuItems.createdAt,
    })
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId))
    .orderBy(asc(menuItems.category), asc(menuItems.name));

  if (filters.category) {
    query = query.where(
      sql`LOWER(${menuItems.category}) = LOWER(${filters.category})`
    );
  }
  if (filters.isAvailable !== undefined) {
    query = query.where(eq(menuItems.isAvailable, filters.isAvailable));
  }
  if (filters.limit) query = query.limit(Number(filters.limit));
  return await query;
}

export async function getMenuItemById(itemId) {
  const rows = await db
    .select({
      item_id: menuItems.id,
      restaurant_id: menuItems.restaurantId,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      category: menuItems.category,
      is_available: menuItems.isAvailable,
      preparation_time: menuItems.preparationTime,
      image_url: menuItems.imageUrl,
      created_at: menuItems.createdAt,
    })
    .from(menuItems)
    .where(eq(menuItems.id, itemId))
    .limit(1);
  return rows[0] || null;
}

export async function deleteMenuItemRow(restaurantId, itemId) {
  await db
    .delete(menuItems)
    .where(
      and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, itemId))
    );
}

export async function setMenuItemAvailability(
  restaurantId,
  itemId,
  isAvailable
) {
  await db
    .update(menuItems)
    .set({ isAvailable })
    .where(
      and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, itemId))
    );
}

export async function getMenuItemsByIds(restaurantId, itemIds) {
  return db
    .select({
      item_id: menuItems.id,
      name: menuItems.name,
      price: menuItems.price,
      category: menuItems.category,
      is_available: menuItems.isAvailable,
    })
    .from(menuItems)
    .where(
      and(
        eq(menuItems.restaurantId, restaurantId),
        inArray(menuItems.id, itemIds)
      )
    );
}
