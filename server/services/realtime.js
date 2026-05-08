const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const env = require("../config/env");
const Character = require("../models/Character");

let io;

function getSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return String(authToken).trim();
  }

  const header = socket.handshake.headers?.authorization || "";

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return "";
}

function getCharacterRoom(characterId) {
  return `character:${characterId}`;
}

function getRealtime() {
  return io;
}

function emitToCharacter(characterId, eventName, payload) {
  if (!io || !characterId) {
    return false;
  }

  io.to(getCharacterRoom(characterId)).emit(eventName, payload);
  return true;
}

async function authenticateSocket(socket, next) {
  try {
    if (!env.JWT_SECRET) {
      return next(new Error("JWT_SECRET is not configured."));
    }

    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error("Authentication token required."));
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    if (!payload?.characterId) {
      return next(new Error("Authentication token is invalid."));
    }

    const character = await Character.findOne({
      characterId: payload.characterId,
    })
      .select("characterId isAdmin canAdvanceRound isDead")
      .lean();

    if (!character) {
      return next(new Error("Character not found."));
    }

    socket.auth = {
      characterId: character.characterId,
      isAdmin: Boolean(character.isAdmin),
      canAdvanceRound: Boolean(character.canAdvanceRound),
      isDead: Boolean(character.isDead),
    };

    return next();
  } catch (error) {
    return next(new Error("Authentication token is invalid or expired."));
  }
}

function initializeRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: false,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const characterId = socket.auth.characterId;

    socket.join(getCharacterRoom(characterId));
    socket.emit("realtime:ready", {
      characterId,
    });
  });

  return io;
}

module.exports = {
  emitToCharacter,
  getCharacterRoom,
  getRealtime,
  initializeRealtime,
};
