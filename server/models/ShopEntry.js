const mongoose = require("mongoose");

const itemTemplateSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const shopEntrySchema = new mongoose.Schema(
  {
    shopId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["item", "clue"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    itemTemplate: {
      type: itemTemplateSchema,
      default: undefined,
    },
    clueId: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopEntry", shopEntrySchema);
