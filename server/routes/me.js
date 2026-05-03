const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const { requireAuth } = require("../middleware/auth");
const { toSafeLoggedInCharacter } = require("../utils/characterPayload");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
      });
    }

    const character = await Character.findOne({
      characterId: req.auth.characterId,
    }).lean();

    if (!character) {
      return res.status(404).json({
        error: "Character not found.",
      });
    }

    return res.json({
      character: toSafeLoggedInCharacter(character),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
