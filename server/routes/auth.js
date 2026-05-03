const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const env = require("../config/env");
const { requireAuth } = require("../middleware/auth");
const { toPublicCharacter, toSafeLoggedInCharacter } = require("../utils/characterPayload");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
      });
    }

    if (!env.JWT_SECRET) {
      return res.status(503).json({
        error: "JWT_SECRET is not configured yet.",
      });
    }

    const { characterId, password } = req.body;

    if (!characterId || !password) {
      return res.status(400).json({
        error: "Character and password are required.",
      });
    }

    const character = await Character.findOne({
      characterId: String(characterId).toLowerCase(),
    }).select("+passwordHash");

    if (!character) {
      return res.status(401).json({
        error: "Character login failed.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, character.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Character login failed.",
      });
    }

    const token = jwt.sign(
      {
        characterId: character.characterId,
        name: character.name,
        isAdmin: character.isAdmin,
        canAdvanceRound: character.canAdvanceRound,
      },
      env.JWT_SECRET,
      { expiresIn: env.TOKEN_TTL }
    );

    return res.json({
      token,
      character: toSafeLoggedInCharacter(character),
      publicCharacter: toPublicCharacter(character),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
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
