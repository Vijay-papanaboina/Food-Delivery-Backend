import { desc, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { drivers } from "../db/schema.js";

export async function upsertDriver(driver) {
  await db
    .insert(drivers)
    .values({
      id: driver.driverId,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      licensePlate: driver.licensePlate,
      isAvailable: driver.isAvailable,
      currentLocationLat:
        driver.currentLocation?.lat != null
          ? String(driver.currentLocation.lat)
          : null,
      currentLocationLng:
        driver.currentLocation?.lng != null
          ? String(driver.currentLocation.lng)
          : null,
      rating: driver.rating != null ? String(driver.rating) : "0.0",
      totalDeliveries:
        driver.totalDeliveries != null ? String(driver.totalDeliveries) : "0",
      createdAt: driver.createdAt ? new Date(driver.createdAt) : undefined,
      updatedAt: driver.updatedAt ? new Date(driver.updatedAt) : new Date(),
    })
    .onConflictDoUpdate({
      target: drivers.id,
      set: {
        isAvailable: sql`excluded.is_available`,
        currentLocationLat: sql`excluded.current_location_lat`,
        currentLocationLng: sql`excluded.current_location_lng`,
        rating: sql`excluded.rating`,
        totalDeliveries: sql`excluded.total_deliveries`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

// Simple function to update driver availability
export async function updateDriverAvailability(driverId, isAvailable) {
  await db
    .update(drivers)
    .set({
      isAvailable,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(drivers.id, driverId));
}

export async function getDriver(driverId) {
  const rows = await db
    .select({
      driver_id: drivers.id,
      name: drivers.name,
      phone: drivers.phone,
      vehicle: drivers.vehicle,
      license_plate: drivers.licensePlate,
      is_available: drivers.isAvailable,
      current_location_lat: drivers.currentLocationLat,
      current_location_lng: drivers.currentLocationLng,
      rating: drivers.rating,
      total_deliveries: drivers.totalDeliveries,
      created_at: drivers.createdAt,
      updated_at: drivers.updatedAt,
    })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (rows[0]) {
    const driver = rows[0];
    if (driver.current_location_lat && driver.current_location_lng) {
      driver.current_location = {
        lat: parseFloat(driver.current_location_lat),
        lng: parseFloat(driver.current_location_lng),
      };
    }
    delete driver.current_location_lat;
    delete driver.current_location_lng;
    return driver;
  }

  return null;
}

export async function getDrivers(filters = {}) {
  let query = db
    .select({
      driver_id: drivers.id,
      name: drivers.name,
      phone: drivers.phone,
      vehicle: drivers.vehicle,
      license_plate: drivers.licensePlate,
      is_available: drivers.isAvailable,
      current_location_lat: drivers.currentLocationLat,
      current_location_lng: drivers.currentLocationLng,
      rating: drivers.rating,
      total_deliveries: drivers.totalDeliveries,
      created_at: drivers.createdAt,
      updated_at: drivers.updatedAt,
    })
    .from(drivers)
    .orderBy(desc(drivers.rating), desc(drivers.totalDeliveries));

  if (filters.isAvailable !== undefined) {
    query = query.where(eq(drivers.isAvailable, filters.isAvailable));
  }
  if (filters.limit) {
    query = query.limit(Number(filters.limit));
  }

  const rows = await query;
  return rows.map((driver) => {
    if (driver.current_location_lat && driver.current_location_lng) {
      driver.current_location = {
        lat: parseFloat(driver.current_location_lat),
        lng: parseFloat(driver.current_location_lng),
      };
    }
    delete driver.current_location_lat;
    delete driver.current_location_lng;
    return driver;
  });
}
