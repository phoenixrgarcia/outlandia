const jwt = require("jsonwebtoken");
const env = require("../config/env");

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function requireAuth(req, res, next) {
  if (!env.JWT_SECRET) {
    return res.status(503).json({
      error: "JWT_SECRET is not configured yet.",
    });
  }

  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: "Authentication token required.",
    });
  }

  try {
    req.auth = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Authentication token is invalid or expired.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({
      error: "Admin access required.",
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
