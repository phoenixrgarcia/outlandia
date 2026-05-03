const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function toPublicCharacter(character) {
  return {
    id: character.characterId,
    name: character.name,
    player: character.player,
    class: character.class,
    faction: character.faction,
    publicBlurb: character.publicBlurb,
    isDead: character.isDead,
  };
}

function toPrivateCharacter(character) {
  return {
    ...toPublicCharacter(character),
    inventory: character.inventory,
    abilities: character.abilities,
    secret: character.secret,
    twist: character.twist,
    goals: character.goals,
    clues: character.clues,
    purchasedClueIds: character.purchasedClueIds,
    privateInformation: character.privateInformation,
    relationships: character.relationships,
    money: character.money,
    isAdmin: character.isAdmin,
    canAdvanceRound: character.canAdvanceRound,
    statuses: character.statuses,
    modifiers: character.modifiers,
  };
}

router.get("/public", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
        characters: [],
      });
    }

    const characters = await Character.find()
      .sort({ faction: 1, name: 1 })
      .select("characterId name player class faction publicBlurb isDead")
      .lean();

    res.json({
      characters: characters.map(toPublicCharacter),
    });
  } catch (error) {
    next(error);
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
      character: toPrivateCharacter(character),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
