const mongoose = require("mongoose");

const audienceSectionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: "",
    },
    factions: {
      type: [String],
      default: [],
    },
    classes: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const clueSchema = new mongoose.Schema(
  {
    clueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    body: {
      type: String,
      default: "",
    },
    availableRound: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    audienceSections: {
      type: [audienceSectionSchema],
      default: [],
    },
    clueType: {
      type: String,
      enum: ["global", "character", "shop"],
      default: "global",
      index: true,
    },
    isRevealedGlobally: {
      type: Boolean,
      default: false,
      index: true,
    },
    revealedAt: {
      type: Date,
    },
    revealedByCharacterId: {
      type: String,
      default: "",
      index: true,
    },
    ownerCharacterId: {
      type: String,
      default: "",
      index: true,
    },
    purchaserCharacterIds: {
      type: [String],
      default: [],
      index: true,
    },
    price: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ gold: 0, silver: 0 }),
    },
    tags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "placeholder",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clue", clueSchema);
