const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};
