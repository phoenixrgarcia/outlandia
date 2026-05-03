const express = require("express");
const mongoose = require("mongoose");
const Clue = require("../models/Clue");

const router = express.Router();

function toPublicGlobalClue(clue) {
  return {
    id: clue.clueId,
    title: clue.title,
    summary: clue.summary,
    body: clue.body,
    revealedAt: clue.revealedAt,
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

    const clues = await Clue.find({
      clueType: "global",
      isRevealedGlobally: true,
    })
      .sort({ revealedAt: -1, title: 1 })
      .select("clueId title summary body revealedAt")
      .lean();

    return res.json({
      clues: clues.map(toPublicGlobalClue),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
