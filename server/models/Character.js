const mongoose = require("mongoose");

const stringArray = {
  type: [String],
  default: [],
};

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { _id: false }
);

const statusSchema = new mongoose.Schema(
  {
    statusId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true },
    note: { type: String, default: "" },
    expiresAt: Date,
  },
  { _id: false }
);

const modifierSchema = new mongoose.Schema(
  {
    modifierId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    appliesTo: {
      type: String,
      default: "general",
      trim: true,
    },
    usesRemaining: {
      type: Number,
      default: 1,
      min: 0,
    },
    expiresAt: Date,
  },
  { _id: false }
);

const characterSchema = new mongoose.Schema(
  {
    characterId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    player: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    faction: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    publicBlurb: {
      type: String,
      default: "",
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    inventory: {
      type: [inventoryItemSchema],
      default: [],
    },
    secret: stringArray,
    twist: stringArray,
    goals: stringArray,
    clues: stringArray,
    purchasedClueIds: {
      type: [String],
      default: [],
      index: true,
    },
    privateInformation: stringArray,
    relationships: stringArray,
    // Stored as separate gold and silver. Shop spending treats 5 silver as 1 gold.
    money: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ gold: 0, silver: 0 }),
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    canAdvanceRound: {
      type: Boolean,
      default: false,
    },
    isDead: {
      type: Boolean,
      default: false,
      index: true,
    },
    statuses: {
      type: [statusSchema],
      default: [],
    },
    modifiers: {
      type: [modifierSchema],
      default: [],
    },
  },
  { timestamps: true }
);

characterSchema.index({
  name: "text",
  player: "text",
  class: "text",
  faction: "text",
});

module.exports = mongoose.model("Character", characterSchema);
