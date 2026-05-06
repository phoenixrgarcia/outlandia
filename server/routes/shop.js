const express = require("express");
const mongoose = require("mongoose");
const ShopEntry = require("../models/ShopEntry");

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

module.exports = router;
