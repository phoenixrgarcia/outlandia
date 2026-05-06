const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const ShopEntry = require("../models/ShopEntry");
const { requireAuth } = require("../middleware/auth");
const { logGameEvent } = require("../services/eventLog");
const { toSafeLoggedInCharacter } = require("../utils/characterPayload");

const router = express.Router();

function toPublicShopEntry(entry) {
  return {
    id: entry.shopId,
    type: entry.type,
    name: entry.name,
    description: entry.description,
    price: entry.price,
    itemTemplate: entry.type === "item" ? entry.itemTemplate : undefined,
    clueId: entry.type === "clue" ? entry.clueId : undefined,
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

      if (character.money < entry.price) {
        return res.status(400).json({
          error: "Not enough money.",
        });
      }

      const previousMoney = character.money;
      character.money -= entry.price;
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
          nextMoney: character.money,
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
      if (character.money < entry.price) {
        return res.status(400).json({
          error: "Not enough money.",
        });
      }

      const purchasedItem = incrementInventory(character, entry.itemTemplate);

      if (!purchasedItem) {
        return res.status(400).json({
          error: "Shop item is missing its item template.",
        });
      }

      const previousMoney = character.money;
      character.money -= entry.price;
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
          nextMoney: character.money,
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
