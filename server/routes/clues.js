const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Clue = require("../models/Clue");
const Character = require("../models/Character");
const env = require("../config/env");

const router = express.Router();

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

async function getViewer(req) {
  const token = getBearerToken(req);

  if (!token || !env.JWT_SECRET) {
    return null;
  }

  try {
    const auth = jwt.verify(token, env.JWT_SECRET);

    if (!auth?.characterId) {
      return null;
    }

    return Character.findOne({ characterId: auth.characterId })
      .select("characterId class faction")
      .lean();
  } catch (error) {
    return null;
  }
}

function viewerCanSeeSection(viewer, section) {
  if (!viewer || !section) {
    return false;
  }

  const factions = section.factions || [];
  const classes = section.classes || [];

  return factions.includes(viewer.faction) || classes.includes(viewer.class);
}

function buildBodyForViewer(clue, viewer) {
  const sections = (clue.audienceSections || []).filter((section) => viewerCanSeeSection(viewer, section));
  const sectionText = sections
    .map((section) => `${section.label}:\n${section.body}`)
    .join("\n\n");

  return [clue.body, sectionText].filter(Boolean).join("\n\n");
}

function toPublicGlobalClue(clue, viewer) {
  return {
    id: clue.clueId,
    title: clue.title,
    summary: clue.summary,
    body: buildBodyForViewer(clue, viewer),
    revealedAt: clue.revealedAt,
    availableRound: clue.availableRound || 1,
  };
}

router.get("/global", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
        clues: [],
      });
    }

    const viewer = await getViewer(req);
    const clues = await Clue.find({
      clueType: "global",
      isRevealedGlobally: true,
    })
      .sort({ revealedAt: -1, title: 1 })
      .select("clueId title summary body audienceSections availableRound revealedAt")
      .lean();

    return res.json({
      clues: clues.map((clue) => toPublicGlobalClue(clue, viewer)),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
