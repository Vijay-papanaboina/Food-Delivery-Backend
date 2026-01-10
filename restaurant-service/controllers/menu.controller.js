import {
  addMenuItemService,
  updateMenuItemService,
  deleteMenuItemService,
  toggleMenuItemAvailabilityService,
  getMenuItemService,
  validateMenuItemsService,
} from "../services/menu.service.js";

export const addMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const item = await addMenuItemService(restaurantId, req.body);

    res.status(201).json({
      message: "Menu item added successfully",
      item,
    });
  } catch (error) {
    console.error("Error adding menu item:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to add menu item", details: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const item = await updateMenuItemService(restaurantId, itemId, req.body);

    res.json({ 
      message: "Menu item updated successfully", 
      item,
    });
  } catch (error) {
    console.error("Error updating menu item:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to update menu item", details: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    await deleteMenuItemService(restaurantId, itemId);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error.message);
    res
      .status(500)
      .json({ error: "Failed to delete menu item", details: error.message });
  }
};

export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const { isAvailable } = req.body;
    
    const result = await toggleMenuItemAvailabilityService(restaurantId, itemId, isAvailable);
    
    res.json({
      message: `Menu item ${result.isAvailable ? "enabled" : "disabled"} successfully`,
      itemId: result.itemId,
      isAvailable: result.isAvailable,
    });
  } catch (error) {
    console.error("Error toggling menu item availability:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to toggle availability", details: error.message });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await getMenuItemService(itemId);

    res.json({
      message: "Menu item retrieved successfully",
      item,
    });
  } catch (error) {
    console.error("Error getting menu item:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to get menu item", details: error.message });
  }
};

export const validateMenuItemsForOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { items } = req.body;

    const result = await validateMenuItemsService(restaurantId, items);
    
    res.json(result);
  } catch (error) {
    console.error("Error validating menu items:", error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to validate menu items", details: error.message });
  }
};