const mongoose = require("mongoose");

const inboxMessageSchema = new mongoose.Schema(
  {
    characterId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "system",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    oldState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventLog",
    },
  },
  { timestamps: true }
);

inboxMessageSchema.index({ characterId: 1, createdAt: -1 });
inboxMessageSchema.index({ characterId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("InboxMessage", inboxMessageSchema);
