const mongoose = require("mongoose");

const eventLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorCharacterId: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventLog", eventLogSchema);
