const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");
const { requireAuth, requireAdmin, requireRoundAdvancer } = require("../middleware/auth");
const { logAdminAction } = require("../services/eventLog");
const { createAndEmitInboxMessage } = require("../services/inbox");
const { emitToCharacter } = require("../services/realtime");
const { normalizeCurrency, currency } = require("../utils/currency");

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
    money: normalizeCurrency(character.money),
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
    availableRound: clue.availableRound || 1,
    clueType: clue.clueType,
    isRevealedGlobally: clue.isRevealedGlobally,
    revealedAt: clue.revealedAt,
    revealedByCharacterId: clue.revealedByCharacterId,
    ownerCharacterId: clue.ownerCharacterId,
    purchaserCharacterIds: clue.purchaserCharacterIds,
    price: normalizeCurrency(clue.price),
    tags: clue.tags,
    audienceSections: clue.audienceSections || [],
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
    const gameState = await GameState.getSingleton().lean();
    const currentRound = gameState?.currentRound || 1;
    const clues = await Clue.find()
      .or([
        { clueType: { $ne: "global" } },
        { availableRound: { $lte: currentRound } },
      ])
      .sort({ clueType: 1, availableRound: 1, title: 1 })
      .select("clueId title summary availableRound audienceSections clueType isRevealedGlobally revealedAt revealedByCharacterId ownerCharacterId purchaserCharacterIds price tags")
      .lean();

    return res.json({
      currentRound,
      clues: clues.map(toAdminClue),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/round/advance", requireAuth, requireAdmin, requireRoundAdvancer, ensureDatabase, async (req, res, next) => {
  try {
    const previousGameState = await GameState.getSingleton();
    const previousRound = previousGameState.currentRound;

    previousGameState.currentRound = previousRound + 1;
    previousGameState.roundStartedAt = new Date();
    previousGameState.updatedBy = req.auth.characterId;
    await previousGameState.save();

    if (previousGameState.currentRound === 3) {
      const upkeepCharacters = await Character.find({
        isAdmin: false,
        faction: { $ne: "GMs" },
      }).select("characterId name money");
      const paidUpkeep = [];

      await Promise.all(
        upkeepCharacters.map(async (character) => {
          const money = normalizeCurrency(character.money);

          if (money.gold < 5) {
            return;
          }

          character.money = currency(money.gold - 5, money.silver);
          character.markModified("money");
          await character.save();
          paidUpkeep.push(character.characterId);
          await createAndEmitInboxMessage({
            characterId: character.characterId,
            title: "Round 3 Upkeep Paid",
            body: "Five gold has been paid for the round 3 upkeep.",
            type: "round",
          });
        }),
      );

      await logAdminAction(req, {
        action: "round.upkeep.applied",
        targetType: "gameState",
        targetId: previousGameState.key,
        details: {
          round: previousGameState.currentRound,
          goldCharged: 5,
          paidCharacterIds: paidUpkeep,
        },
      });
    }

    await logAdminAction(req, {
      action: "round.advanced",
      targetType: "gameState",
      targetId: previousGameState.key,
      details: {
        previousRound,
        nextRound: previousGameState.currentRound,
        roundStartedAt: previousGameState.roundStartedAt,
      },
    });

    return res.json({
      gameState: previousGameState.toObject(),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/characters/:id/money", requireAuth, requireAdmin, ensureDatabase, async (req, res, next) => {
  try {
    const money = normalizeCurrency(req.body.money);

    if (!Number.isFinite(money.gold) || !Number.isFinite(money.silver)) {
      return res.status(400).json({
        error: "Currency must include non-negative gold and silver amounts.",
      });
    }

    const character = await findCharacterOr404(req.params.id, res);

    if (!character) {
      return null;
    }

    const previousMoney = normalizeCurrency(character.money);
    character.money = money;
    character.markModified("money");
    await character.save();
    await logAdminAction(req, {
      action: "money.changed",
      targetType: "character",
      targetId: character.characterId,
      details: {
        previousMoney,
        nextMoney: normalizeCurrency(character.money),
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

    if (status.expiresAt && Number.isNaN(status.expiresAt.getTime())) {
      return res.status(400).json({
        error: "Status expiration must be a valid date.",
      });
    }

    const previousStatuses = character.statuses.map((item) => (
      item.toObject ? item.toObject() : item
    ));
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
    await createAndEmitInboxMessage({
      characterId: character.characterId,
      title: "Status Added",
      body: status.note
        ? `${status.name}: ${status.note}`
        : `${status.name} has been added to your character.`,
      type: "status",
      oldState: {
        statuses: previousStatuses,
      },
      newState: {
        status,
        statuses: character.statuses.map((item) => (
          item.toObject ? item.toObject() : item
        )),
      },
    });
    emitToCharacter(character.characterId, "status:update", {
      characterId: character.characterId,
      statuses: character.statuses.map((item) => (
        item.toObject ? item.toObject() : item
      )),
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
    const previousStatuses = character.statuses.map((item) => (
      item.toObject ? item.toObject() : item
    ));
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
    await createAndEmitInboxMessage({
      characterId: character.characterId,
      title: "Status Removed",
      body: removedStatus?.name
        ? `${removedStatus.name} is no longer active.`
        : "A status is no longer active.",
      type: "status",
      oldState: {
        status: removedStatus?.toObject ? removedStatus.toObject() : removedStatus,
        statuses: previousStatuses,
      },
      newState: {
        statuses: character.statuses.map((item) => (
          item.toObject ? item.toObject() : item
        )),
      },
    });
    emitToCharacter(character.characterId, "status:update", {
      characterId: character.characterId,
      statuses: character.statuses.map((item) => (
        item.toObject ? item.toObject() : item
      )),
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

    const gameState = await GameState.getSingleton();
    const currentRound = gameState?.currentRound || 1;

    if (clue.clueType === "global" && (clue.availableRound || 1) > currentRound) {
      return res.status(400).json({
        error: `This clue is not available until round ${clue.availableRound}.`,
      });
    }

    const previousRevealState = clue.isRevealedGlobally;
    clue.isRevealedGlobally = reveal;
    clue.revealedAt = reveal ? new Date() : undefined;
    clue.revealedByCharacterId = reveal ? req.auth.characterId : "";
    await clue.save();

    if (gameState) {
      if (reveal) {
        gameState.globalClueIds = Array.from(new Set([...(gameState.globalClueIds || []), clue.clueId]));
      } else {
        gameState.globalClueIds = (gameState.globalClueIds || []).filter((clueId) => clueId !== clue.clueId);
      }
      await gameState.save();
    }
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
