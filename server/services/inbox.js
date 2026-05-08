const InboxMessage = require("../models/InboxMessage");
const { emitToCharacter } = require("./realtime");

function normalizeMessageType(type) {
  return String(type || "system").trim().toLowerCase() || "system";
}

function toInboxMessagePayload(message) {
  return {
    id: String(message._id),
    characterId: message.characterId,
    title: message.title,
    body: message.body,
    type: message.type,
    read: Boolean(message.read),
    readAt: message.readAt || null,
    oldState: message.oldState,
    newState: message.newState,
    relatedEventId: message.relatedEventId ? String(message.relatedEventId) : null,
    timestamp: message.createdAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

async function createInboxMessage({
  characterId,
  title,
  body,
  type = "system",
  oldState,
  newState,
  relatedEventId,
}) {
  return InboxMessage.create({
    characterId,
    title,
    body,
    type: normalizeMessageType(type),
    oldState,
    newState,
    relatedEventId,
  });
}

async function createAndEmitInboxMessage(messageInput) {
  const message = await createInboxMessage(messageInput);
  const payload = toInboxMessagePayload(message.toObject());

  emitToCharacter(message.characterId, "inbox:new", {
    message: payload,
  });

  return message;
}

module.exports = {
  createAndEmitInboxMessage,
  createInboxMessage,
  normalizeMessageType,
  toInboxMessagePayload,
};
