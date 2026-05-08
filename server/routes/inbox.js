const express = require("express");
const mongoose = require("mongoose");
const InboxMessage = require("../models/InboxMessage");
const { requireAuth } = require("../middleware/auth");
const { toInboxMessagePayload } = require("../services/inbox");
const { emitToCharacter } = require("../services/realtime");

const router = express.Router();

function ensureDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database is not connected yet.",
    });
  }

  return next();
}

function getValidMessageIds(messageIds) {
  if (!Array.isArray(messageIds)) {
    return [];
  }

  return messageIds
    .map((messageId) => String(messageId || "").trim())
    .filter((messageId) => mongoose.isValidObjectId(messageId));
}

router.get("/", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const characterId = req.auth.characterId;
    const shouldMarkRead = req.query.markRead !== "false";
    const messages = await InboxMessage.find({ characterId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const unreadMessageIds = messages
      .filter((message) => !message.read)
      .map((message) => message._id);

    if (shouldMarkRead && unreadMessageIds.length) {
      const readAt = new Date();
      await InboxMessage.updateMany(
        {
          _id: { $in: unreadMessageIds },
          characterId,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt,
          },
        }
      );
      const unreadMessageIdSet = new Set(unreadMessageIds.map((messageId) => String(messageId)));

      messages.forEach((message) => {
        if (unreadMessageIdSet.has(String(message._id))) {
          message.read = true;
          message.readAt = readAt;
        }
      });

      emitToCharacter(characterId, "inbox:read", {
        messageIds: unreadMessageIds.map((messageId) => String(messageId)),
        unreadCount: 0,
      });
    }

    return res.json({
      messages: messages.map(toInboxMessagePayload),
      unreadCount: unreadMessageIds.length,
      markedReadCount: shouldMarkRead ? unreadMessageIds.length : 0,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/mark-read", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const characterId = req.auth.characterId;
    const body = req.body || {};
    const messageIds = getValidMessageIds(body.messageIds);
    const filter = {
      characterId,
      read: false,
    };

    if (Array.isArray(body.messageIds)) {
      if (!messageIds.length) {
        return res.status(400).json({
          error: "No valid inbox message IDs were provided.",
        });
      }

      filter._id = { $in: messageIds };
    }

    const result = await InboxMessage.updateMany(filter, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });
    const unreadCount = await InboxMessage.countDocuments({
      characterId,
      read: false,
    });

    if (result.modifiedCount) {
      emitToCharacter(characterId, "inbox:read", {
        messageIds: messageIds.length ? messageIds : [],
        markedReadCount: result.modifiedCount,
        unreadCount,
      });
    }

    return res.json({
      markedReadCount: result.modifiedCount,
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
