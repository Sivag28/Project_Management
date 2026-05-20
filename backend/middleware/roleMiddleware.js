export const adminOnly = (req, res, next) => {
  if (req.user.role?.name !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

export const managerOnly = (req, res, next) => {
  if (req.user.role?.name !== "manager" && req.user.role?.name !== "admin")
    return res.status(403).json({ message: "Manager or Admin only" });
  next();
};
