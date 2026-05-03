const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const env = require("../config/env");
const Character = require("../models/Character");
const GameState = require("../models/GameState");

async function seed() {
  if (!env.MONGODB_URI) {
    console.log("MONGODB_URI is not set. Seed skipped.");
    console.log("Add a MongoDB connection string to .env before seeding placeholder data.");
    return;
  }

  await connectDB();

  const passwordHash = await bcrypt.hash("placeholder", 10);

  await Character.updateOne(
    { characterId: "gm-placeholder" },
    {
      $setOnInsert: {
        characterId: "gm-placeholder",
        name: "GM Placeholder",
        player: "Player Placeholder",
        class: "Game Master",
        faction: "GMs",
        publicBlurb: "TODO: Public placeholder blurb.",
        passwordHash,
        inventory: [
          {
            itemId: "placeholder-item",
            name: "TODO: Placeholder inventory item",
            note: "TODO: Placeholder item note.",
            quantity: 1,
          },
        ],
        abilities: [
          {
            abilityId: "placeholder-ability",
            name: "TODO: Placeholder ability",
            description: "TODO: Placeholder ability description.",
            usesPerRound: 0,
            usesRemaining: 0,
            requiresAdminResolution: false,
          },
        ],
        secret: "TODO: Placeholder secret.",
        twist: "TODO: Placeholder twist.",
        goals: ["TODO: Placeholder goal."],
        clues: ["TODO: Placeholder character clue."],
        purchasedClueIds: [],
        privateInformation: ["TODO: Placeholder private information."],
        relationships: [],
        money: 0,
        isAdmin: true,
        canAdvanceRound: true,
        isDead: false,
        statuses: [],
        modifiers: [],
      },
    },
    { upsert: true }
  );

  await GameState.updateOne(
    { key: "main" },
    {
      $setOnInsert: {
        key: "main",
        currentRound: 1,
        globalClueIds: [],
        deadCharacterIds: [],
        statuses: [],
      },
    },
    { upsert: true }
  );

  console.log("Seed complete: ensured GM placeholder and game state.");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
