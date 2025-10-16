import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { menuItems } from '../db/schema.js';

export async function upsertMenuItem(menuItem) {
  await db
    .insert(menuItems)
    .values({
      itemId: menuItem.itemId,
      restaurantId: menuItem.restaurantId,
      name: menuItem.name,
      description: menuItem.description,
      price: String(menuItem.price),
      category: menuItem.category,
      isAvailable: menuItem.isAvailable,
      preparationTime: menuItem.preparationTime,
      createdAt: menuItem.createdAt ? new Date(menuItem.createdAt) : undefined,
    })
    .onConflictDoUpdate({
      target: menuItems.itemId,
      set: {
        restaurantId: sql`excluded.restaurant_id`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        price: sql`excluded.price`,
        category: sql`excluded.category`,
        isAvailable: sql`excluded.is_available`,
        preparationTime: sql`excluded.preparation_time`,
      },
    });
}

export async function getMenuItems(restaurantId, filters = {}) {
  let query = db
    .select({
      item_id: menuItems.itemId,
      restaurant_id: menuItems.restaurantId,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      category: menuItems.category,
      is_available: menuItems.isAvailable,
      preparation_time: menuItems.preparationTime,
      created_at: menuItems.createdAt,
    })
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId))
    .orderBy(asc(menuItems.category), asc(menuItems.name));

  if (filters.category) {
    query = query.where(sql`LOWER(${menuItems.category}) = LOWER(${filters.category})`);
  }
  if (filters.isAvailable !== undefined) {
    query = query.where(eq(menuItems.isAvailable, filters.isAvailable));
  }
  if (filters.limit) query = query.limit(Number(filters.limit));
  return await query;
}


