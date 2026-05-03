const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Character = require("../models/Character");

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

async function requireAdmin(req, res, next) {
  try {
    if (!req.auth?.characterId) {
      return res.status(403).json({
        error: "Admin access required.",
      });
    }

    const character = await Character.findOne({
      characterId: req.auth.characterId,
    })
      .select("characterId isAdmin canAdvanceRound")
      .lean();

    if (!character?.isAdmin) {
      return res.status(403).json({
        error: "Admin access required.",
      });
    }

    req.adminCharacter = character;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function requireRoundAdvancer(req, res, next) {
  try {
    if (!req.auth?.characterId) {
      return res.status(403).json({
        error: "Round advancement access required.",
      });
    }

    const character = await Character.findOne({
      characterId: req.auth.characterId,
    })
      .select("characterId canAdvanceRound")
      .lean();

    if (!character?.canAdvanceRound) {
      return res.status(403).json({
        error: "Round advancement access required.",
      });
    }

    req.roundAdvancerCharacter = character;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireRoundAdvancer,
};
