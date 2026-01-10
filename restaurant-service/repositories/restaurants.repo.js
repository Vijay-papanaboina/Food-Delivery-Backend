import { Restaurant } from "../db/schema.js";

export async function upsertRestaurant(restaurantData) {
  // If ID is provided, try to find and update
  if (restaurantData.id) {
    const existing = await Restaurant.findById(restaurantData.id);
    if (existing) {
      Object.assign(existing, restaurantData);
      await existing.save();
      return existing.toObject();
    }
  }

  // Otherwise create new
  // Note: Mongoose generates _id automatically, so we don't need to pass it if it's new
  // But if we want to preserve the UUID from the input as _id (if it's a migration), we can try
  // However, Mongoose _id is ObjectId by default. 
  // The user wants to migrate to MongoDB, so we should let Mongo generate IDs.
  // BUT, if the input `restaurantData` comes from a seed script with specific IDs, we might need to handle that.
  // For now, we'll assume standard Mongoose behavior: new doc = new _id.
  
  const newRestaurant = new Restaurant(restaurantData);
  await newRestaurant.save();
  return newRestaurant.toObject();
}



export async function getRestaurant(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);
  return restaurant ? restaurant.toObject() : null;
}

export async function getRestaurantByOwner(ownerId) {
  const restaurant = await Restaurant.findOne({ ownerId });
  return restaurant ? restaurant.toObject() : null;
}

export async function getRestaurants(filters = {}) {
  const query = {};

  if (filters.search) {
    query.name = { $regex: new RegExp(filters.search, "i") };
  }
  if (filters.cuisine) {
    query.cuisine = { $regex: new RegExp(filters.cuisine, "i") };
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.minRating) {
    query.rating = { $gte: Number(filters.minRating) };
  }

  let dbQuery = Restaurant.find(query).sort({ rating: -1 });

  if (filters.limit) {
    dbQuery = dbQuery.limit(Number(filters.limit));
  }

  const restaurants = await dbQuery;

  return restaurants.map(r => r.toObject());
}

export async function toggleRestaurantStatus(restaurantId, isOpen) {
  await Restaurant.findByIdAndUpdate(restaurantId, { isOpen });
}

export async function getRestaurantStatus(restaurantId) {
  return await Restaurant.findById(restaurantId)
    .select("isOpen openingTime closingTime isActive")
}

export async function getRestaurantStats() {
  const totalRestaurants = await Restaurant.countDocuments();
  const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
  
  const ratingResult = await Restaurant.aggregate([
    { $group: { _id: null, avgRating: { $avg: "$rating" } } }
  ]);
  const averageRating = ratingResult.length > 0 
    ? Number(ratingResult[0].avgRating.toFixed(2)) 
    : 0;

  const cuisineResult = await Restaurant.aggregate([
    { $group: { _id: "$cuisine", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const byCuisine = {};
  cuisineResult.forEach(item => {
    byCuisine[item._id] = item.count;
  });

  return {
    totalRestaurants,
    activeRestaurants,
    averageRating,
    byCuisine,
  };
}
