const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logAdminAction } = require("../services/eventLog");

const router = express.Router();

function ensureDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database is not connected yet.",
    });
  }

  return next();
}

function summarizeStatus(status) {
  if (!status) {
    return "";
  }

  return [status.name, status.note].filter(Boolean).join(": ");
}

function summarizeInventoryItem(item) {
  if (!item) {
    return "";
  }

  const quantity = item.quantity && item.quantity !== 1 ? `${item.quantity} x ` : "";
  return `${quantity}${item.name || item.itemId || "Unnamed item"}`;
}

function toAdminCharacter(character) {
  const statuses = character.statuses || [];
  const inventory = character.inventory || [];

  return {
    id: character.characterId,
    name: character.name,
    player: character.player,
    class: character.class,
    faction: character.faction,
    money: character.money,
    isAdmin: character.isAdmin,
    canAdvanceRound: character.canAdvanceRound,
    isDead: character.isDead,
    statusSummary: statuses.map(summarizeStatus).filter(Boolean).join("; ") || "None",
    inventorySummary: inventory.map(summarizeInventoryItem).filter(Boolean).join(", ") || "None",
    statuses,
    inventory,
    modifiers: character.modifiers || [],
    statusCount: statuses.length,
    inventoryCount: inventory.length,
  };
}

function toAdminClue(clue) {
  return {
    id: clue.clueId,
    title: clue.title,
    summary: clue.summary,
    clueType: clue.clueType,
    isRevealedGlobally: clue.isRevealedGlobally,
    revealedAt: clue.revealedAt,
    revealedByCharacterId: clue.revealedByCharacterId,
    ownerCharacterId: clue.ownerCharacterId,
    purchaserCharacterIds: clue.purchaserCharacterIds,
    price: clue.price,
    tags: clue.tags,
  };
}

function normalizeInventory(items) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items
    .map((item) => ({
      itemId: String(item.itemId || crypto.randomUUID()).trim().toLowerCase(),
      name: String(item.name || "").trim(),
      note: String(item.note || "").trim(),
      quantity: Math.max(0, Number(item.quantity ?? 1)),
    }))
    .filter((item) => item.name);
}

async function findCharacterOr404(characterId, res) {
  const character = await Character.findOne({
    characterId: String(characterId || "").toLowerCase(),
  });

  if (!character) {
    res.status(404).json({
      error: "Character not found.",
    });
    return null;
  }

  return character;
}

router.get("/summary", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const [gameState, characters, clueCounts] = await Promise.all([
      GameState.getSingleton().lean(),
      Character.find()
        .sort({ faction: 1, name: 1 })
        .select("characterId name player class faction money isAdmin canAdvanceRound isDead statuses inventory modifiers")
        .lean(),
      Clue.aggregate([
        {
          $group: {
            _id: "$clueType",
            count: { $sum: 1 },
            revealed: {
              $sum: {
                $cond: ["$isRevealedGlobally", 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    return res.json({
      adminCharacter: req.adminCharacter,
      gameState,
      characters: characters.map(toAdminCharacter),
      clueCounts: clueCounts.map((item) => ({
        type: item._id,
        count: item.count,
        revealed: item.revealed,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/characters", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { player: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const characters = await Character.find(filter)
      .sort({ faction: 1, name: 1 })
      .select("characterId name player class faction money isAdmin canAdvanceRound isDead statuses inventory modifiers")
      .lean();

    return res.json({
      characters: characters.map(toAdminCharacter),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/clues", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const clues = await Clue.find()
      .sort({ clueType: 1, title: 1 })
      .select("clueId title summary clueType isRevealedGlobally revealedAt revealedByCharacterId ownerCharacterId purchaserCharacterIds price tags")
      .lean();

    return res.json({
      clues: clues.map(toAdminClue),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/characters/:id/money", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const money = Number(req.body.money);

    if (!Number.isFinite(money) || money < 0) {
      return res.status(400).json({
        error: "Money must be a non-negative number.",
      });
    }

    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const previousMoney = character.money;
    character.money = money;
    await character.save();
    await logAdminAction(req, {
      action: "money.changed",
      targetType: "character",
      targetId: character.characterId,
      details: {
        previousMoney,
        nextMoney: character.money,
      },
    });

    return res.json({
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/characters/:id/inventory", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const inventory = normalizeInventory(req.body.inventory);

    if (!inventory) {
      return res.status(400).json({
        error: "Inventory must be an array of items.",
      });
    }

    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const previousInventory = character.inventory.map((item) => item.toObject ? item.toObject() : item);
    character.inventory = inventory;
    await character.save();
    await logAdminAction(req, {
      action: "inventory.changed",
      targetType: "character",
      targetId: character.characterId,
      details: {
        previousInventory,
        nextInventory: character.inventory.map((item) => item.toObject ? item.toObject() : item),
      },
    });

    return res.json({
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/characters/:id/death", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    if (typeof req.body.isDead !== "boolean") {
      return res.status(400).json({
        error: "isDead must be true or false.",
      });
    }

    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const previousIsDead = character.isDead;
    character.isDead = req.body.isDead;
    await character.save();

    await GameState.updateOne(
      { key: "main" },
      req.body.isDead
        ? { $addToSet: { deadCharacterIds: character.characterId } }
        : { $pull: { deadCharacterIds: character.characterId } },
      { upsert: true }
    );
    await logAdminAction(req, {
      action: "death.changed",
      targetType: "character",
      targetId: character.characterId,
      details: {
        previousIsDead,
        nextIsDead: character.isDead,
      },
    });

    return res.json({
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/characters/:id/statuses", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        error: "Status name is required.",
      });
    }

    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const status = {
      statusId: String(req.body.statusId || crypto.randomUUID()).trim().toLowerCase(),
      name,
      note: String(req.body.note || "").trim(),
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    };

    character.statuses.push(status);
    await character.save();
    await logAdminAction(req, {
      action: "status.added",
      targetType: "character",
      targetId: character.characterId,
      details: {
        status,
      },
    });

    return res.status(201).json({
      status,
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/characters/:id/statuses/:statusId", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const originalCount = character.statuses.length;
    const removedStatus = character.statuses.find(
      (status) => status.statusId === String(req.params.statusId).toLowerCase()
    );
    character.statuses = character.statuses.filter(
      (status) => status.statusId !== String(req.params.statusId).toLowerCase()
    );

    if (character.statuses.length === originalCount) {
      return res.status(404).json({
        error: "Status not found.",
      });
    }

    await character.save();
    await logAdminAction(req, {
      action: "status.removed",
      targetType: "character",
      targetId: character.characterId,
      details: {
        status: removedStatus?.toObject ? removedStatus.toObject() : removedStatus,
      },
    });

    return res.json({
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/modifiers/:modifierId/consume", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const modifierId = String(req.params.modifierId || "").toLowerCase();
    const characterFilter = req.body.characterId
      ? { characterId: String(req.body.characterId).toLowerCase() }
      : {};

    const character = await Character.findOne({
      ...characterFilter,
      "modifiers.modifierId": modifierId,
    });

    if (!character) {
      return res.status(404).json({
        error: "Modifier not found.",
      });
    }

    const modifier = character.modifiers.find((item) => item.modifierId === modifierId);

    if (!modifier || modifier.usesRemaining <= 0) {
      return res.status(400).json({
        error: "Modifier has no uses remaining.",
      });
    }

    const previousUsesRemaining = modifier.usesRemaining;
    modifier.usesRemaining -= 1;
    await character.save();
    await logAdminAction(req, {
      action: "modifier.consumed",
      targetType: "modifier",
      targetId: modifier.modifierId,
      details: {
        characterId: character.characterId,
        previousUsesRemaining,
        nextUsesRemaining: modifier.usesRemaining,
      },
    });

    return res.json({
      modifier,
      character: toAdminCharacter(character.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/clues/:id/reveal", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const reveal = req.body.isRevealedGlobally ?? true;

    if (typeof reveal !== "boolean") {
      return res.status(400).json({
        error: "isRevealedGlobally must be true or false.",
      });
    }

    const clue = await Clue.findOne({
      clueId: String(req.params.id || "").toLowerCase(),
    });

    if (!clue) {
      return res.status(404).json({
        error: "Clue not found.",
      });
    }

    const previousRevealState = clue.isRevealedGlobally;
    clue.isRevealedGlobally = reveal;
    clue.revealedAt = reveal ? new Date() : undefined;
    clue.revealedByCharacterId = reveal ? req.auth.characterId : "";
    await clue.save();

    await GameState.updateOne(
      { key: "main" },
      reveal
        ? { $addToSet: { globalClueIds: clue.clueId } }
        : { $pull: { globalClueIds: clue.clueId } },
      { upsert: true }
    );
    await logAdminAction(req, {
      action: "clue.reveal.changed",
      targetType: "clue",
      targetId: clue.clueId,
      details: {
        previousRevealState,
        nextRevealState: clue.isRevealedGlobally,
        revealedAt: clue.revealedAt,
        revealedByCharacterId: clue.revealedByCharacterId,
      },
    });

    return res.json({
      clue: toAdminClue(clue.toObject()),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
