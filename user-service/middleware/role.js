export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized: No role found" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(401).json({ 
        error: `Unauthorized: Requires ${allowedRoles.join(" or ")} role` 
      });
    }
    
    next();
  };
};
