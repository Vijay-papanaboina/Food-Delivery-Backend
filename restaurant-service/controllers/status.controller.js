import { toggleRestaurantStatus, getRestaurantStatus } from "../repositories/restaurants.repo.js";

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isOpen } = req.body;
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ error: "isOpen must be a boolean" });
    }
    await toggleRestaurantStatus(restaurantId, isOpen);
    res.json({ message: `Restaurant ${isOpen ? "opened" : "closed"} successfully`, restaurantId, isOpen });
  } catch (error) {
    console.error("Error toggling restaurant status:", error.message);
    res.status(500).json({ error: "Failed to toggle restaurant status", details: error.message });
  }
};

export const checkRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const r = await getRestaurantStatus(restaurantId);
    if (!r) return res.status(404).json({ error: "Restaurant not found" });
    let reason = "Restaurant is open";
    let open = r.is_open && r.is_active;
    if (!open) {
      reason = !r.is_active ? "Restaurant is inactive" : "Restaurant is temporarily closed";
    }
    res.json({ restaurantId, isOpen: open, reason });
  } catch (error) {
    console.error("Error checking restaurant status:", error.message);
    res.status(500).json({ error: "Failed to check restaurant status", details: error.message });
  }
};


