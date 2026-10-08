export const adminOnly = (req, res, next) => {
  if (req.user.role?.name?.toLowerCase() !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

export const managerOnly = (req, res, next) => {
  const roleName = req.user.role?.name?.toLowerCase();
  if (roleName !== "manager" && roleName !== "admin")
    return res.status(403).json({ message: "Manager or Admin only" });
  next();
};
