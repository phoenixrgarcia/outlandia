const EventLog = require("../models/EventLog");

function buildEventLogEntry(req, { action, targetType, targetId, details = {} }) {
  return {
    action,
    actorCharacterId: req.auth?.characterId || "unknown",
    targetType,
    targetId,
    details,
  };
}

async function logAdminAction(req, event) {
  return EventLog.create(buildEventLogEntry(req, event));
}

module.exports = {
  logAdminAction,
};
