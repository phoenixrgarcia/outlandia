const mongoose = require("mongoose");

const gameStatusSchema = new mongoose.Schema(
  {
    characterId: String,
    name: String,
    note: {
      type: String,
      default: "",
    },
    expiresAt: Date,
  },
  { _id: false }
);

const gameStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true,
      immutable: true,
    },
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    roundStartedAt: {
      type: Date,
      default: Date.now,
    },
    globalClueIds: {
      type: [String],
      default: [],
    },
    deadCharacterIds: {
      type: [String],
      default: [],
    },
    statuses: {
      type: [gameStatusSchema],
      default: [],
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

gameStateSchema.statics.getSingleton = function getSingleton() {
  return this.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" } },
    { new: true, upsert: true }
  );
};

module.exports = mongoose.model("GameState", gameStateSchema);
