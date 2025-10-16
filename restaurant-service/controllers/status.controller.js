import { db } from "../config/db.js";
import { sql } from "drizzle-orm";

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isOpen } = req.body;
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ error: "isOpen must be a boolean" });
    }
    await db.execute(sql`UPDATE restaurant_svc.restaurants SET is_open = ${isOpen} WHERE restaurant_id = ${restaurantId}`);
    res.json({ message: `Restaurant ${isOpen ? "opened" : "closed"} successfully`, restaurantId, isOpen });
  } catch (error) {
    console.error("Error toggling restaurant status:", error.message);
    res.status(500).json({ error: "Failed to toggle restaurant status", details: error.message });
  }
};

export const checkRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const result = await db.execute(sql`SELECT is_open, opening_time, closing_time, is_active FROM restaurant_svc.restaurants WHERE restaurant_id = ${restaurantId}`);
    const r = (result.rows || result)[0];
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


