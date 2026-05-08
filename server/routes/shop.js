const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const ShopEntry = require("../models/ShopEntry");
const { requireAuth } = require("../middleware/auth");
const { logGameEvent } = require("../services/eventLog");
const { createAndEmitInboxMessage } = require("../services/inbox");
const { emitToCharacter } = require("../services/realtime");
const { toSafeLoggedInCharacter } = require("../utils/characterPayload");
const { canAffordCurrency, normalizeCurrency, spendCurrency } = require("../utils/currency");

const router = express.Router();

function toPublicShopEntry(entry) {
  return {
    id: entry.shopId,
    type: entry.type,
    name: entry.name,
    description: entry.description,
    price: normalizeCurrency(entry.price),
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
  return entry.type === "item" && entry.itemTemplate?.itemId === "sample-poison";
}

function normalizeCharacterId(characterId) {
  return String(characterId || "").trim().toLowerCase();
}

function createPoisonStatus() {
  return {
    statusId: `poisoned-${Date.now()}`,
    name: "Poisoned",
    note: "Sample poison effect for realtime notification testing.",
  };
}

router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is not connected yet.",
        entries: [],
      });
    }

    const entries = await ShopEntry.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("shopId type name description price itemTemplate clueId")
      .lean();

    return res.json({
      entries: entries.map(toPublicShopEntry),
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
      isAdmin: false,
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

      if (!canAffordCurrency(character.money, entry.price)) {
        return res.status(400).json({
          error: "Not enough currency.",
        });
      }

      const previousMoney = normalizeCurrency(character.money);
      character.money = spendCurrency(character.money, entry.price);
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
          price: entry.price,
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
        entry: toPublicShopEntry(entry),
        character: toSafeLoggedInCharacter(character),
        clue: toPurchasedClue(clue),
        alreadyPurchased: false,
        message: "Clue purchased.",
      });
    }

    if (entry.type === "item") {
      if (!canAffordCurrency(character.money, entry.price)) {
        return res.status(400).json({
          error: "Not enough currency.",
        });
      }

      if (isPoisonEntry(entry)) {
        const targetCharacterId = normalizeCharacterId(req.body.targetCharacterId);

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

        const previousBuyerMoney = normalizeCurrency(character.money);
        const previousTargetStatuses = target.statuses.map((status) => (
          status.toObject ? status.toObject() : status
        ));
        const poisonStatus = createPoisonStatus();

        character.money = spendCurrency(character.money, entry.price);
        character.markModified("money");
        target.statuses.push(poisonStatus);

        await Promise.all([character.save(), target.save()]);
        await logGameEvent(req, {
          action: "shop.poison.used",
          targetType: "character",
          targetId: target.characterId,
          details: {
            shopId: entry.shopId,
            price: entry.price,
            buyerCharacterId: character.characterId,
            targetCharacterId: target.characterId,
            previousBuyerMoney,
            nextBuyerMoney: normalizeCurrency(character.money),
            status: poisonStatus,
          },
        });
        await createAndEmitInboxMessage({
          characterId: character.characterId,
          title: "Poison Delivered",
          body: `${target.name} has been marked Poisoned for this test.`,
          type: "shop",
          oldState: {
            money: previousBuyerMoney,
          },
          newState: {
            money: normalizeCurrency(character.money),
            targetCharacterId: target.characterId,
            status: poisonStatus,
          },
        });
        await createAndEmitInboxMessage({
          characterId: target.characterId,
          title: "You Have Been Poisoned",
          body: "A poison effect has been applied to your character.",
          type: "status",
          oldState: {
            statuses: previousTargetStatuses,
          },
          newState: {
            status: poisonStatus,
            statuses: target.statuses.map((status) => (
              status.toObject ? status.toObject() : status
            )),
          },
        });

        emitToCharacter(target.characterId, "status:update", {
          characterId: target.characterId,
          statuses: target.statuses.map((status) => (
            status.toObject ? status.toObject() : status
          )),
        });

        return res.status(201).json({
          entry: toPublicShopEntry(entry),
          character: toSafeLoggedInCharacter(character),
          target: toPoisonTarget(target),
          status: poisonStatus,
          message: `${target.name} has been poisoned.`,
        });
      }

      const purchasedItem = incrementInventory(character, entry.itemTemplate);

      if (!purchasedItem) {
        return res.status(400).json({
          error: "Shop item is missing its item template.",
        });
      }

      const previousMoney = normalizeCurrency(character.money);
      character.money = spendCurrency(character.money, entry.price);
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
          price: entry.price,
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
        entry: toPublicShopEntry(entry),
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

module.exports = router;
