import { getRestaurant } from "../repositories/restaurants.repo.js";

export const requireRestaurantOwnership = async (req, res, next) => {
  const restaurantId = req.params.restaurantId || req.params.id;
  
  if (!restaurantId) {
    return res.status(400).json({ error: "Restaurant ID required" });
  }
  
  const restaurant = await getRestaurant(restaurantId);
  
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  
  if (restaurant.ownerId.toString() !== req.user.userId) {
    return res.status(401).json({ 
      error: "Unauthorized: You do not own this restaurant" 
    });
  }
  
  next();
};
