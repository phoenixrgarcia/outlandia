const Character = require("../models/Character");
const EventLog = require("../models/EventLog");
const { createAndEmitInboxMessage } = require("./inbox");
const { emitToCharacter } = require("./realtime");

const DEFAULT_STATUS_EXPIRATION_INTERVAL_MS = 30 * 1000;
let statusExpirationTimer = null;
let isProcessingStatusExpirations = false;

function toPlainStatus(status) {
  return status?.toObject ? status.toObject() : status;
}

function isExpiredStatus(status, now) {
  return status.expiresAt && new Date(status.expiresAt) <= now;
}

async function expireCharacterStatuses(character, now) {
  const previousStatuses = character.statuses.map(toPlainStatus);
  const expiredStatuses = previousStatuses.filter((status) => isExpiredStatus(status, now));

  if (!expiredStatuses.length) {
    return 0;
  }

  const expiredStatusIds = new Set(expiredStatuses.map((status) => status.statusId));
  character.statuses = character.statuses.filter((status) => !expiredStatusIds.has(status.statusId));
  await character.save();

  const nextStatuses = character.statuses.map(toPlainStatus);

  await Promise.all(expiredStatuses.map((status) => createAndEmitInboxMessage({
    characterId: character.characterId,
    title: "Status Expired",
    body: status.name
      ? `${status.name} is no longer active.`
      : "A timed status is no longer active.",
    type: "status",
    oldState: {
      status,
      statuses: previousStatuses,
    },
    newState: {
      statuses: nextStatuses,
    },
  })));

  emitToCharacter(character.characterId, "status:update", {
    characterId: character.characterId,
    statuses: nextStatuses,
  });

  await EventLog.create({
    action: "status.expired",
    actorCharacterId: "system",
    targetType: "character",
    targetId: character.characterId,
    details: {
      expiredStatuses,
      expiredAt: now,
    },
  });

  return expiredStatuses.length;
}

async function processExpiredStatuses(now = new Date()) {
  if (isProcessingStatusExpirations) {
    return 0;
  }

  isProcessingStatusExpirations = true;

  try {
    const characters = await Character.find({
      "statuses.expiresAt": { $lte: now },
    });
    let expiredCount = 0;

    for (const character of characters) {
      expiredCount += await expireCharacterStatuses(character, now);
    }

    return expiredCount;
  } finally {
    isProcessingStatusExpirations = false;
  }
}

function startStatusExpirationScheduler({
  intervalMs = DEFAULT_STATUS_EXPIRATION_INTERVAL_MS,
} = {}) {
  if (statusExpirationTimer) {
    return statusExpirationTimer;
  }

  processExpiredStatuses().catch((error) => {
    console.error("Status expiration check failed.", error);
  });

  statusExpirationTimer = setInterval(() => {
    processExpiredStatuses().catch((error) => {
      console.error("Status expiration check failed.", error);
    });
  }, intervalMs);

  return statusExpirationTimer;
}

function stopStatusExpirationScheduler() {
  if (!statusExpirationTimer) {
    return;
  }

  clearInterval(statusExpirationTimer);
  statusExpirationTimer = null;
}

module.exports = {
  processExpiredStatuses,
  startStatusExpirationScheduler,
  stopStatusExpirationScheduler,
};
