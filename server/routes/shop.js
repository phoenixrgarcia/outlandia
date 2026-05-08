const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const EventLog = require("../models/EventLog");
const GameState = require("../models/GameState");
const ShopEntry = require("../models/ShopEntry");
const { requireAuth } = require("../middleware/auth");
const { logGameEvent } = require("../services/eventLog");
const { createAndEmitInboxMessage } = require("../services/inbox");
const { emitToCharacter } = require("../services/realtime");
const { toSafeLoggedInCharacter } = require("../utils/characterPayload");
const { canAffordCurrency, normalizeCurrency, spendCurrency } = require("../utils/currency");

const router = express.Router();

function scaledPrice(entry, round) {
  const basePrice = normalizeCurrency(entry.price);

  if (entry.priceScaling === false) {
    return basePrice;
  }

  const multiplier = round >= 3 ? 1.32 : round >= 2 ? 1.2 : 1;

  return {
    gold: Math.ceil(basePrice.gold * multiplier),
    silver: Math.ceil(basePrice.silver * multiplier),
  };
}

function toPublicShopEntry(entry, round = 1, stock = {}) {
  return {
    id: entry.shopId,
    type: entry.type,
    category: entry.category || "Items",
    name: entry.name,
    description: entry.description,
    price: scaledPrice(entry, round),
    basePrice: normalizeCurrency(entry.price),
    availableFromRound: entry.availableFromRound || 1,
    availableToRound: entry.availableToRound || 0,
    favorRequired: entry.favorRequired || 0,
    stockTotal: entry.stockTotal || 0,
    stockPerRound: entry.stockPerRound || 0,
    remainingTotal: stock.remainingTotal,
    remainingThisRound: stock.remainingThisRound,
    oncePerCharacterPerRound: Boolean(entry.oncePerCharacterPerRound),
    useDefinition: entry.useDefinition || {},
    itemTemplate: entry.type === "item" ? entry.itemTemplate : undefined,
    clueId: entry.type === "clue" ? entry.clueId : undefined,
  };
}

function toPoisonTarget(character) {
  return {
    id: character.characterId,
    name: character.name,
    player: character.player,
    class: character.class,
    faction: character.faction,
    isDead: character.isDead,
  };
}

function toPurchasedClue(clue) {
  return {
    id: clue.clueId,
    title: clue.title,
    summary: clue.summary,
    body: clue.body,
  };
}

function normalizeShopId(shopId) {
  return String(shopId || "").trim().toLowerCase();
}

function ensureDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database is not connected yet.",
    });
  }

  return next();
}

function incrementInventory(character, itemTemplate) {
  const template = itemTemplate || {};
  const itemId = String(template.itemId || "").trim().toLowerCase();
  const name = String(template.name || "").trim();
  const quantity = Math.max(1, Number(template.quantity || 1));

  if (!name) {
    return null;
  }

  const existingItem = character.inventory.find((item) => {
    if (itemId && item.itemId) {
      return item.itemId === itemId;
    }

    return item.name === name;
  });

  if (existingItem) {
    existingItem.quantity = Number(existingItem.quantity || 0) + quantity;
    if (template.note && !existingItem.note) {
      existingItem.note = template.note;
    }
    return existingItem;
  }

  const newItem = {
    itemId,
    name,
    note: String(template.note || "").trim(),
    quantity,
  };

  character.inventory.push(newItem);
  return newItem;
}

function isPoisonEntry(entry) {
  return entry.type === "item" && entry.itemTemplate?.itemId === "poison-vial";
}

function normalizeCharacterId(characterId) {
  return String(characterId || "").trim().toLowerCase();
}

function createPoisonStatus() {
  return {
    statusId: `poisoned-${Date.now()}`,
    name: "Poisoned",
    note: "A poison effect has been applied.",
  };
}

function currentRoundDateFilter(round) {
  return { "details.round": round };
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function inventoryItemLabel(item) {
  return item?.name || item?.itemId || "Unknown item";
}

const FALLBACK_ITEM_USE_DEFINITIONS = {
  "poison-vial": {
    shopId: "poison-vial",
    useDefinition: {
      action: "poison",
      requiresTarget: true,
      consumeOnUse: true,
    },
  },
  "antidote-kit": {
    shopId: "antidote-kit",
    useDefinition: {
      action: "antidote",
      consumeOnUse: true,
    },
  },
};

function gmNoticeContext({ actor, itemName, appliesTo, extra = "" }) {
  return [
    `Used by: ${actor.name} (${actor.player || "Unknown player"})`,
    `Item: ${itemName}`,
    `Applies to: ${appliesTo || actor.name}`,
    extra,
  ]
    .filter(Boolean)
    .join("\n");
}

async function notifyGms({ title, body, type = "gm_notice" }) {
  const gms = await Character.find({
    $or: [{ isAdmin: true }, { faction: "GMs" }],
  })
    .select("characterId")
    .lean();

  await Promise.all(
    gms.map((gm) =>
      createAndEmitInboxMessage({
        characterId: gm.characterId,
        title,
        body,
        type,
      }),
    ),
  );
}

async function getShopRound() {
  const gameState = await GameState.getSingleton().lean();

  return gameState?.currentRound || 1;
}

async function getStockForEntry(entry, round) {
  const [totalPurchased, roundPurchased] = await Promise.all([
    entry.stockTotal
      ? EventLog.countDocuments({
          action: "shop.item.purchased",
          targetId: entry.shopId,
        })
      : Promise.resolve(0),
    entry.stockPerRound || entry.oncePerCharacterPerRound
      ? EventLog.countDocuments({
          action: "shop.item.purchased",
          targetId: entry.shopId,
          ...currentRoundDateFilter(round),
        })
      : Promise.resolve(0),
  ]);

  return {
    totalPurchased,
    roundPurchased,
    remainingTotal: entry.stockTotal ? Math.max(0, entry.stockTotal - totalPurchased) : null,
    remainingThisRound: entry.stockPerRound ? Math.max(0, entry.stockPerRound - roundPurchased) : null,
  };
}

function isAvailableInRound(entry, round) {
  const from = entry.availableFromRound || 1;
  const to = entry.availableToRound || 0;

  return from <= round && (!to || to >= round);
}

router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
        entries: [],
      });
    }

    const round = await getShopRound();
    const entries = await ShopEntry.find({
      active: true,
      availableFromRound: { $lte: round },
      $or: [{ availableToRound: 0 }, { availableToRound: { $gte: round } }],
    })
      .sort({ sortOrder: 1, name: 1 })
      .select("shopId type category name description price priceScaling favorRequired stockTotal stockPerRound oncePerCharacterPerRound availableFromRound availableToRound useDefinition itemTemplate clueId")
      .lean();
    const entriesWithStock = await Promise.all(
      entries.map(async (entry) => ({
        entry,
        stock: await getStockForEntry(entry, round),
      })),
    );

    return res.json({
      currentRound: round,
      entries: entriesWithStock
        .filter(({ stock }) => (
          (stock.remainingTotal === null || stock.remainingTotal > 0) &&
          (stock.remainingThisRound === null || stock.remainingThisRound > 0)
        ))
        .map(({ entry, stock }) => toPublicShopEntry(entry, round, stock)),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/purchased-clues", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const character = await Character.findOne({
      characterId: req.auth.characterId,
    })
      .select("purchasedClueIds")
      .lean();

    if (!character) {
      return res.status(404).json({
        error: "Character not found.",
      });
    }

    const clues = await Clue.find({
      clueId: { $in: character.purchasedClueIds || [] },
      clueType: "shop",
    })
      .select("clueId title summary body")
      .lean();

    return res.json({
      clues: clues.map(toPurchasedClue),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/targets", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const effect = String(req.query.effect || "").trim().toLowerCase();

    if (effect !== "poison") {
      return res.status(400).json({
        error: "Unsupported target list.",
      });
    }

    const targets = await Character.find({
      characterId: { $ne: req.auth.characterId },
      isAdmin: { $ne: true },
      faction: { $ne: "GMs" },
    })
      .sort({ faction: 1, name: 1 })
      .select("characterId name player class faction isDead")
      .lean();

    return res.json({
      targets: targets.map(toPoisonTarget),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/purchase", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const shopId = normalizeShopId(req.body.shopId);

    if (!shopId) {
      return res.status(400).json({
        error: "Shop entry is required.",
      });
    }

    const round = await getShopRound();
    const [entry, character] = await Promise.all([
      ShopEntry.findOne({ shopId, active: true }).lean(),
      Character.findOne({ characterId: req.auth.characterId }),
    ]);

    if (!entry) {
      return res.status(404).json({
        error: "Shop entry not found.",
      });
    }

    if (!character) {
      return res.status(404).json({
        error: "Character not found.",
      });
    }

    if (!isAvailableInRound(entry, round)) {
      return res.status(400).json({
        error: "This shop item is not available in the current round.",
      });
    }

    if (character.isAdmin || character.faction === "GMs") {
      return res.status(400).json({
        error: "GM/admin characters cannot purchase gameplay shop items.",
      });
    }

    const stock = await getStockForEntry(entry, round);

    if (stock.remainingTotal !== null && stock.remainingTotal <= 0) {
      return res.status(400).json({
        error: "This item is out of stock.",
      });
    }

    if (stock.remainingThisRound !== null && stock.remainingThisRound <= 0) {
      return res.status(400).json({
        error: "This item is sold out for the current round.",
      });
    }

    if (entry.oncePerCharacterPerRound) {
      const existingPurchase = await EventLog.exists({
        action: "shop.item.purchased",
        actorCharacterId: character.characterId,
        targetId: entry.shopId,
        ...currentRoundDateFilter(round),
      });

      if (existingPurchase) {
        return res.status(400).json({
          error: "You have already purchased this item this round.",
        });
      }
    }

    const purchasePrice = scaledPrice(entry, round);

    if (entry.type === "clue") {
      const clue = await Clue.findOne({
        clueId: entry.clueId,
        clueType: "shop",
      });

      if (!clue) {
        return res.status(404).json({
          error: "Shop clue not found.",
        });
      }

      const alreadyPurchased = character.purchasedClueIds.includes(clue.clueId);

      if (alreadyPurchased) {
        return res.json({
          entry: toPublicShopEntry(entry),
          character: toSafeLoggedInCharacter(character),
          clue: toPurchasedClue(clue),
          alreadyPurchased: true,
          message: "Purchased clue already available.",
        });
      }

      if (!canAffordCurrency(character.money, purchasePrice)) {
        return res.status(400).json({
          error: "Not enough currency.",
        });
      }

      const previousMoney = normalizeCurrency(character.money);
      character.money = spendCurrency(character.money, purchasePrice);
      character.markModified("money");
      character.purchasedClueIds.push(clue.clueId);

      if (!clue.purchaserCharacterIds.includes(character.characterId)) {
        clue.purchaserCharacterIds.push(character.characterId);
      }

      await Promise.all([character.save(), clue.save()]);
      await logGameEvent(req, {
        action: "shop.clue.purchased",
        targetType: "shopEntry",
        targetId: entry.shopId,
        details: {
          clueId: clue.clueId,
          price: purchasePrice,
          round,
          previousMoney,
          nextMoney: normalizeCurrency(character.money),
        },
      });
      await createAndEmitInboxMessage({
        characterId: character.characterId,
        title: "Clue Purchased",
        body: `${clue.title} has been added to your private purchased clues.`,
        type: "shop",
        oldState: {
          money: previousMoney,
          purchasedClueIds: character.purchasedClueIds.filter((clueId) => clueId !== clue.clueId),
        },
        newState: {
          money: normalizeCurrency(character.money),
          purchasedClueIds: character.purchasedClueIds,
          clueId: clue.clueId,
        },
      });

      return res.status(201).json({
        entry: toPublicShopEntry(entry, round, stock),
        character: toSafeLoggedInCharacter(character),
        clue: toPurchasedClue(clue),
        alreadyPurchased: false,
        message: "Clue purchased.",
      });
    }

    if (entry.type === "item") {
      if (!canAffordCurrency(character.money, purchasePrice)) {
        return res.status(400).json({
          error: "Not enough currency.",
        });
      }

      const purchasedItem = incrementInventory(character, entry.itemTemplate);

      if (!purchasedItem) {
        return res.status(400).json({
          error: "Shop item is missing its item template.",
        });
      }

      const previousMoney = normalizeCurrency(character.money);
      character.money = spendCurrency(character.money, purchasePrice);
      character.markModified("money");
      await character.save();
      await logGameEvent(req, {
        action: "shop.item.purchased",
        targetType: "shopEntry",
        targetId: entry.shopId,
        details: {
          itemId: purchasedItem.itemId,
          itemName: purchasedItem.name,
          quantity: purchasedItem.quantity,
          price: purchasePrice,
          round,
          favorRequired: entry.favorRequired || 0,
          previousMoney,
          nextMoney: normalizeCurrency(character.money),
        },
      });
      await createAndEmitInboxMessage({
        characterId: character.characterId,
        title: "Item Purchased",
        body: `${purchasedItem.name} has been added to your inventory.`,
        type: "shop",
        oldState: {
          money: previousMoney,
        },
        newState: {
          money: normalizeCurrency(character.money),
          item: purchasedItem,
        },
      });

      return res.status(201).json({
        entry: toPublicShopEntry(entry, round, stock),
        character: toSafeLoggedInCharacter(character),
        item: purchasedItem,
        message: "Item purchased.",
      });
    }

    return res.status(400).json({
      error: "Unsupported shop entry type.",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/items/:itemId/use", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const itemId = normalizeShopId(req.params.itemId);
    const targetCharacterId = normalizeCharacterId(req.body.targetCharacterId);
    const character = await Character.findOne({ characterId: req.auth.characterId });

    if (!character) {
      return res.status(404).json({
        error: "Character not found.",
      });
    }

    if (character.isAdmin || character.faction === "GMs") {
      return res.status(400).json({
        error: "GM/admin characters cannot use gameplay shop items.",
      });
    }

    const inventoryItem = character.inventory.find((item) => item.itemId === itemId);

    if (!inventoryItem || Number(inventoryItem.quantity || 0) <= 0) {
      return res.status(404).json({
        error: "Item not found in your inventory.",
      });
    }

    const entry = await ShopEntry.findOne({
      type: "item",
      $or: [
        { "itemTemplate.itemId": itemId },
        { shopId: itemId },
      ],
    }).lean() || FALLBACK_ITEM_USE_DEFINITIONS[itemId];

    if (!entry) {
      return res.status(404).json({
        error: "This inventory item cannot be used yet.",
      });
    }

    const useDefinition = entry.useDefinition || {};
    const round = await getShopRound();
    const result = {
      itemId,
      itemName: inventoryItemLabel(inventoryItem),
      action: useDefinition.action || "gm_notice",
      consumed: Boolean(useDefinition.consumeOnUse),
      roll: null,
      message: "",
    };

    if (useDefinition.action === "poison") {
      if (!targetCharacterId) {
        return res.status(400).json({
          error: "Choose a target for the poison.",
        });
      }

      if (targetCharacterId === character.characterId) {
        return res.status(400).json({
          error: "Choose another character as the poison target.",
        });
      }

      const target = await Character.findOne({ characterId: targetCharacterId });

      if (!target) {
        return res.status(404).json({
          error: "Poison target not found.",
        });
      }

      if (target.isAdmin || target.faction === "GMs") {
        return res.status(400).json({
          error: "GM and admin characters cannot be poisoned.",
        });
      }

      const poisonStatus = createPoisonStatus();
      target.statuses.push(poisonStatus);
      await target.save();
      await createAndEmitInboxMessage({
        characterId: target.characterId,
        title: "You Have Been Poisoned",
        body: "A poison effect has been applied to your character.",
        type: "status",
      });
      await notifyGms({
        title: "Poison Used",
        body: gmNoticeContext({
          actor: character,
          itemName: "Poison Vial",
          appliesTo: `${target.name} (${target.player || "Unknown player"})`,
          extra: "Effect: Poisoned status applied.",
        }),
        type: "status",
      });
      emitToCharacter(target.characterId, "status:update", {
        characterId: target.characterId,
        statuses: target.statuses.map((status) => (
          status.toObject ? status.toObject() : status
        )),
      });
      result.message = `${target.name} has been poisoned.`;
    } else if (useDefinition.action === "antidote") {
      const previousCount = character.statuses.length;
      character.statuses = character.statuses.filter((status) => (
        !String(status.name || "").toLowerCase().includes("poison") &&
        !String(status.statusId || "").toLowerCase().includes("poison")
      ));
      result.message = previousCount === character.statuses.length
        ? "No poison effect was found, but the antidote was used."
        : "Poison effect removed.";
      await notifyGms({
        title: "Antidote Used",
        body: gmNoticeContext({
          actor: character,
          itemName: "Antidote Kit",
          appliesTo: `${character.name} (${character.player || "Unknown player"})`,
          extra: result.message,
        }),
        type: "status",
      });
    } else if (useDefinition.action === "roll") {
      const die = Math.max(2, Number(useDefinition.die || 20));
      const roll = rollDie(die);
      const successAt = Number(useDefinition.successAt || 0);
      const success = successAt ? roll >= successAt : true;
      result.roll = { die, value: roll, success, successAt: successAt || null };
      result.message = success
        ? (useDefinition.successMessage || `You rolled ${roll}.`)
        : (useDefinition.failureMessage || `You rolled ${roll}.`);

      if (
        useDefinition.notifyGmAlways ||
        (!success && useDefinition.notifyGmOnFailure) ||
        (!success && useDefinition.suspicionDeltaOnFailure)
      ) {
        const suspicionText = !success && useDefinition.suspicionDeltaOnFailure
          ? `Suspicion change for ${character.name}: +${useDefinition.suspicionDeltaOnFailure}.`
          : "";
        await notifyGms({
          title: "Shop Item Roll",
          body: gmNoticeContext({
            actor: character,
            itemName: inventoryItemLabel(inventoryItem),
            appliesTo: `${character.name} (${character.player || "Unknown player"})`,
            extra: [
              `Roll: ${roll} on a d${die}.`,
              `Result: ${result.message}`,
              suspicionText,
            ].filter(Boolean).join("\n"),
          }),
        });
      }
    } else {
      result.message = useDefinition.message || `${inventoryItemLabel(inventoryItem)} used. A GM has been notified.`;

      if (typeof useDefinition.suspicionDelta === "number" || useDefinition.action === "gm_notice") {
        const suspicionText = typeof useDefinition.suspicionDelta === "number"
          ? `Suspicion change for ${character.name}: ${useDefinition.suspicionDelta > 0 ? "+" : ""}${useDefinition.suspicionDelta}.`
          : "";
        await notifyGms({
          title: "Shop Item Used",
          body: gmNoticeContext({
            actor: character,
            itemName: inventoryItemLabel(inventoryItem),
            appliesTo: `${character.name} (${character.player || "Unknown player"})`,
            extra: [result.message, suspicionText].filter(Boolean).join("\n"),
          }),
        });
      }
    }

    if (useDefinition.consumeOnUse) {
      inventoryItem.quantity = Math.max(0, Number(inventoryItem.quantity || 0) - 1);
      character.inventory = character.inventory.filter((item) => Number(item.quantity || 0) > 0);
    }

    await character.save();
    await logGameEvent(req, {
      action: "shop.item.used",
      targetType: "shopEntry",
      targetId: entry.shopId,
      details: {
        itemId,
        round,
        result,
        targetCharacterId,
      },
    });

    await createAndEmitInboxMessage({
      characterId: character.characterId,
      title: "Item Used",
      body: result.roll
        ? `${result.itemName}: rolled ${result.roll.value} on a d${result.roll.die}. ${result.message}`
        : `${result.itemName}: ${result.message}`,
      type: "shop",
    });

    return res.json({
      character: toSafeLoggedInCharacter(character),
      result,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
