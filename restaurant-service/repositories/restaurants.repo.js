import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { restaurants } from "../db/schema.js";

export async function upsertRestaurant(restaurant) {
  await db
    .insert(restaurants)
    .values({
      restaurantId: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      rating: restaurant.rating != null ? String(restaurant.rating) : undefined,
      deliveryTime: restaurant.deliveryTime,
      deliveryFee:
        restaurant.deliveryFee != null
          ? String(restaurant.deliveryFee)
          : undefined,
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt
        ? new Date(restaurant.createdAt)
        : undefined,
    })
    .onConflictDoUpdate({
      target: restaurants.id,
      set: {
        name: sql`excluded.name`,
        cuisine: sql`excluded.cuisine`,
        address: sql`excluded.address`,
        phone: sql`excluded.phone`,
        rating: sql`excluded.rating`,
        deliveryTime: sql`excluded.delivery_time`,
        deliveryFee: sql`excluded.delivery_fee`,
        isActive: sql`excluded.is_active`,
      },
    });
}

export async function getRestaurant(restaurantId) {
  const rows = await db
    .select({
      restaurant_id: restaurants.id,
      owner_id: restaurants.ownerId,
      name: restaurants.name,
      cuisine: restaurants.cuisine,
      address: restaurants.address,
      phone: restaurants.phone,
      rating: restaurants.rating,
      delivery_time: restaurants.deliveryTime,
      delivery_fee: restaurants.deliveryFee,
      is_open: restaurants.isOpen,
      opening_time: restaurants.openingTime,
      closing_time: restaurants.closingTime,
      is_active: restaurants.isActive,
      image_url: restaurants.imageUrl,
      created_at: restaurants.createdAt,
    })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  return rows[0] || null;
}

export async function getRestaurantByOwner(ownerId) {
  const rows = await db
    .select({
      restaurant_id: restaurants.id,
      owner_id: restaurants.ownerId,
      name: restaurants.name,
      cuisine: restaurants.cuisine,
      address: restaurants.address,
      phone: restaurants.phone,
      rating: restaurants.rating,
      delivery_time: restaurants.deliveryTime,
      delivery_fee: restaurants.deliveryFee,
      is_open: restaurants.isOpen,
      opening_time: restaurants.openingTime,
      closing_time: restaurants.closingTime,
      is_active: restaurants.isActive,
      image_url: restaurants.imageUrl,
      created_at: restaurants.createdAt,
    })
    .from(restaurants)
    .where(eq(restaurants.ownerId, ownerId))
    .limit(1);
  return rows[0] || null;
}

export async function getRestaurants(filters = {}) {
  let query = db
    .select({
      restaurant_id: restaurants.id,
      name: restaurants.name,
      cuisine: restaurants.cuisine,
      address: restaurants.address,
      phone: restaurants.phone,
      rating: restaurants.rating,
      delivery_time: restaurants.deliveryTime,
      delivery_fee: restaurants.deliveryFee,
      is_open: restaurants.isOpen,
      opening_time: restaurants.openingTime,
      closing_time: restaurants.closingTime,
      is_active: restaurants.isActive,
      image_url: restaurants.imageUrl,
      created_at: restaurants.createdAt,
    })
    .from(restaurants)
    .orderBy(desc(restaurants.rating));

  const conditions = [];
  if (filters.cuisine)
    conditions.push(
      sql`LOWER(${restaurants.cuisine}) = LOWER(${filters.cuisine})`
    );
  if (filters.isActive !== undefined)
    conditions.push(eq(restaurants.isActive, filters.isActive));
  if (filters.minRating)
    conditions.push(sql`${restaurants.rating} >= ${filters.minRating}`);
  if (conditions.length) query = query.where(and(...conditions));
  if (filters.limit) query = query.limit(Number(filters.limit));
  return await query;
}

export async function toggleRestaurantStatus(restaurantId, isOpen) {
  await db
    .update(restaurants)
    .set({ isOpen })
    .where(eq(restaurants.id, restaurantId));
}

export async function getRestaurantStatus(restaurantId) {
  const rows = await db
    .select({
      is_open: restaurants.isOpen,
      opening_time: restaurants.openingTime,
      closing_time: restaurants.closingTime,
      is_active: restaurants.isActive,
    })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  return rows[0] || null;
}

export async function getRestaurantStats() {
  // total/active/avg rating
  const summaryRows = await db
    .select({
      total_restaurants: sql`COUNT(*)`,
      active_restaurants: sql`COUNT(*) FILTER (WHERE ${restaurants.isActive} = true)`,
      average_rating: sql`AVG(${restaurants.rating})`,
    })
    .from(restaurants);
  const summary = summaryRows[0] || {};

  // by cuisine
  const cuisineRows = await db
    .select({ cuisine: restaurants.cuisine, count: sql`COUNT(*)` })
    .from(restaurants)
    .groupBy(restaurants.cuisine)
    .orderBy(desc(sql`COUNT(*)`));

  return {
    totalRestaurants: parseInt(summary.total_restaurants || 0),
    activeRestaurants: parseInt(summary.active_restaurants || 0),
    averageRating: Number(parseFloat(summary.average_rating || 0).toFixed(2)),
    byCuisine: Object.fromEntries(
      cuisineRows.map((r) => [r.cuisine, parseInt(r.count)])
    ),
  };
}
