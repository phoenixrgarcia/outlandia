const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const env = require("../config/env");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");
const ShopEntry = require("../models/ShopEntry");
const { currency } = require("../utils/currency");

const PLACEHOLDER_CHARACTER_SEEDS = [
  ["gm_01", "Placeholder GM 01", "GM", "GMs"],
  ["royalty_01", "Placeholder Royalty 01", "Monarch", "Royalty"],
  ["royalty_02", "Placeholder Royalty 02", "Heir", "Royalty"],
  ["royalty_03", "Placeholder Royalty 03", "Consort", "Royalty"],
  ["royalty_04", "Placeholder Royalty 04", "Noble", "Royalty"],
  ["court_01", "Placeholder Courtier 01", "Chancellor", "Royal Court"],
  ["court_02", "Placeholder Courtier 02", "Diplomat", "Royal Court"],
  ["court_03", "Placeholder Courtier 03", "Treasurer", "Royal Court"],
  ["court_04", "Placeholder Courtier 04", "Advisor", "Royal Court"],
  ["court_05", "Placeholder Courtier 05", "Scribe", "Royal Court"],
  ["guard_01", "Placeholder Guard 01", "Captain", "The Guards"],
  ["guard_02", "Placeholder Guard 02", "Knight", "The Guards"],
  ["guard_03", "Placeholder Guard 03", "Sentinel", "The Guards"],
  ["guard_04", "Placeholder Guard 04", "Scout", "The Guards"],
  ["guard_05", "Placeholder Guard 05", "Jailer", "The Guards"],
  ["alchemist_01", "Placeholder Alchemist 01", "Alchemist", "Alchemical Expressionist"],
  ["alchemist_02", "Placeholder Alchemist 02", "Apothecary", "Alchemical Expressionist"],
  ["alchemist_03", "Placeholder Alchemist 03", "Transmuter", "Alchemical Expressionist"],
  ["alchemist_04", "Placeholder Alchemist 04", "Researcher", "Alchemical Expressionist"],
  ["magician_01", "Placeholder Magician 01", "Wizard", "Magicians"],
  ["magician_02", "Placeholder Magician 02", "Illusionist", "Magicians"],
  ["magician_03", "Placeholder Magician 03", "Diviner", "Magicians"],
  ["magician_04", "Placeholder Magician 04", "Enchanter", "Magicians"],
  ["magician_05", "Placeholder Magician 05", "Archivist", "Magicians"],
  ["clergy_01", "Placeholder Clergy 01", "High Priest", "The Clergy"],
  ["clergy_02", "Placeholder Clergy 02", "Acolyte", "The Clergy"],
  ["clergy_03", "Placeholder Clergy 03", "Oracle", "The Clergy"],
  ["clergy_04", "Placeholder Clergy 04", "Chaplain", "The Clergy"],
  ["worker_01", "Placeholder Worker 01", "Steward", "The Workers"],
  ["worker_02", "Placeholder Worker 02", "Cook", "The Workers"],
  ["worker_03", "Placeholder Worker 03", "Courier", "The Workers"],
  ["worker_04", "Placeholder Worker 04", "Stablehand", "The Workers"],
  ["worker_05", "Placeholder Worker 05", "Artisan", "The Workers"],
  ["street_01", "Placeholder Street 01", "Merchant", "The Streets"],
  ["street_02", "Placeholder Street 02", "Performer", "The Streets"],
  ["street_03", "Placeholder Street 03", "Informant", "The Streets"],
  ["street_04", "Placeholder Street 04", "Beggar", "The Streets"],
  ["street_05", "Placeholder Street 05", "Traveler", "The Streets"],
  ["street_06", "Placeholder Street 06", "Guild Agent", "The Streets"],
  ["street_07", "Placeholder Street 07", "Fence", "The Streets"],
];

const PLACEHOLDER_GLOBAL_CLUES = [
  {
    clueId: "global-archive-record-01",
    title: "Global Archive Record 01",
    summary: "TODO placeholder for an admin-revealed global clue record.",
    body: "TODO Global Clue Placeholder: Replace this with final public clue text after writers provide approved content.",
  },
  {
    clueId: "global-archive-record-02",
    title: "Global Archive Record 02",
    summary: "TODO placeholder for a public archive entry unlocked during play.",
    body: "TODO Archive Entry Placeholder: This record represents information that an admin may reveal to all players during the event.",
  },
  {
    clueId: "global-archive-record-03",
    title: "Global Archive Record 03",
    summary: "TODO placeholder for a sealed court archive record.",
    body: "TODO Sealed Record Placeholder: This static record emulates a future admin-revealed global clue.",
  },
];

const PLACEHOLDER_SHOP_CLUES = [
  {
    clueId: "shop-private-clue-01",
    title: "TODO Private Shop Clue 01",
    summary: "TODO placeholder preview for a private clue available from the shop.",
    body: "TODO Private Shop Clue Placeholder: Replace this with final purchased clue text after writers provide approved content.",
    price: currency(4, 0),
  },
  {
    clueId: "shop-private-clue-02",
    title: "TODO Private Shop Clue 02",
    summary: "TODO placeholder preview for a second private clue available from the shop.",
    body: "TODO Private Shop Clue Placeholder: This clue should remain private to the buyer when purchase behavior is implemented.",
    price: currency(7, 0),
  },
  {
    clueId: "shop-private-clue-03",
    title: "TODO Private Shop Clue 03",
    summary: "TODO placeholder preview for a higher-cost private clue.",
    body: "TODO Private Shop Clue Placeholder: This is seeded only to prove shop list behavior.",
    price: currency(10, 0),
  },
];

const PLACEHOLDER_SHOP_ENTRIES = [
  {
    shopId: "shop-item-01",
    type: "item",
    name: "TODO Consumable Item 01",
    description: "TODO placeholder shop item description.",
    price: currency(2, 0),
    itemTemplate: {
      itemId: "todo-consumable-item-01",
      name: "TODO Consumable Item 01",
      note: "TODO replace with final item effect notes.",
      quantity: 1,
    },
    sortOrder: 10,
  },
  {
    shopId: "shop-item-02",
    type: "item",
    name: "TODO Consumable Item 02",
    description: "TODO placeholder shop item description.",
    price: currency(5, 0),
    itemTemplate: {
      itemId: "todo-consumable-item-02",
      name: "TODO Consumable Item 02",
      note: "TODO replace with final item effect notes.",
      quantity: 1,
    },
    sortOrder: 20,
  },
  {
    shopId: "shop-poison-01",
    type: "item",
    name: "Sample Poison",
    description: "Test item for Phase 4 notifications. Choose a non-GM target to receive the Poisoned status.",
    price: currency(1, 0),
    itemTemplate: {
      itemId: "sample-poison",
      name: "Sample Poison",
      note: "Testing only: applies Poisoned to a selected non-GM target.",
      quantity: 1,
    },
    sortOrder: 30,
  },
  ...PLACEHOLDER_SHOP_CLUES.map((clue, index) => ({
    shopId: `shop-clue-0${index + 1}`,
    type: "clue",
    name: clue.title,
    description: clue.summary,
    price: clue.price,
    clueId: clue.clueId,
    sortOrder: 100 + index,
  })),
];

function createPlaceholderCharacter(seed, index, passwordHash) {
  const [characterId, name, characterClass, faction] = seed;
  const number = String(index + 1).padStart(2, "0");
  const isAdmin = faction === "GMs";
  const isDead = characterId === "street_07";

  return {
    characterId,
    name,
    player: `Player ${number}`,
    class: characterClass,
    faction,
    publicBlurb: `TODO public character blurb placeholder for ${name}.`,
    passwordHash,
    inventory: [
      {
        itemId: `${characterId}-placeholder-item`,
        name: "TODO inventory placeholder",
        note: "TODO replace with final item notes.",
        quantity: 1,
      },
    ],
    abilities: [
      {
        abilityId: `${characterId}-placeholder-ability`,
        name: "TODO ability placeholder",
        description: "TODO replace with final ability text.",
        usesPerRound: 0,
        usesRemaining: 0,
        requiresAdminResolution: false,
      },
    ],
    secret: "TODO secret placeholder.",
    twist: "TODO twist placeholder.",
    goals: ["TODO goal placeholder."],
    clues: ["TODO character clue placeholder."],
    purchasedClueIds: [],
    privateInformation: ["TODO private information placeholder."],
    relationships: [
      {
        characterId: "",
        name: "TODO relationship placeholder",
        note: "TODO replace with final relationship note.",
      },
    ],
    money: index === 0
      ? currency(0, 0)
      : currency(5 + index, 3 + index),
    isAdmin,
    canAdvanceRound: index === 0,
    isDead,
    statuses: isDead
      ? [
          {
            statusId: "dead-placeholder",
            name: "Dead placeholder for UI testing",
            note: "TODO replace if this character remains dead in final content.",
          },
        ]
      : [],
    modifiers: [],
  };
}

async function seed() {
  if (!env.MONGODB_URI) {
    console.log("MONGODB_URI is not set. Seed skipped.");
    console.log("Add a MongoDB connection string to .env before seeding placeholder data.");
    return;
  }

  await connectDB();

  const characterDocs = await Promise.all(
    PLACEHOLDER_CHARACTER_SEEDS.map(async (seed, index) => {
      const number = String(index + 1).padStart(2, "0");
      const passwordHash = await bcrypt.hash(`10${number}`, 10);
      return createPlaceholderCharacter(seed, index, passwordHash);
    })
  );

  await Character.bulkWrite(
    characterDocs.map((character) => ({
      updateOne: {
        filter: { characterId: character.characterId },
        update: { $set: character },
        upsert: true,
      },
    }))
  );

  const clueDocs = PLACEHOLDER_GLOBAL_CLUES.map((clue) => ({
    ...clue,
    clueType: "global",
    isRevealedGlobally: false,
    revealedAt: null,
    revealedByCharacterId: "",
    ownerCharacterId: "",
    purchaserCharacterIds: [],
    price: currency(0, 0),
    tags: ["TODO", "global-placeholder"],
    source: "phase-1-placeholder-seed",
  }));

  await Clue.bulkWrite(
    clueDocs.map((clue) => ({
      updateOne: {
        filter: { clueId: clue.clueId },
        update: { $set: clue },
        upsert: true,
      },
    }))
  );

  const shopClueDocs = PLACEHOLDER_SHOP_CLUES.map((clue) => ({
    ...clue,
    clueType: "shop",
    isRevealedGlobally: false,
    revealedAt: null,
    revealedByCharacterId: "",
    ownerCharacterId: "",
    purchaserCharacterIds: [],
    tags: ["TODO", "shop-placeholder"],
    source: "phase-4-placeholder-seed",
  }));

  await Clue.bulkWrite(
    shopClueDocs.map((clue) => ({
      updateOne: {
        filter: { clueId: clue.clueId },
        update: { $set: clue },
        upsert: true,
      },
    }))
  );

  await ShopEntry.bulkWrite(
    PLACEHOLDER_SHOP_ENTRIES.map((entry) => ({
      updateOne: {
        filter: { shopId: entry.shopId },
        update: { $set: { ...entry, active: true } },
        upsert: true,
      },
    }))
  );

  await Character.deleteOne({
    characterId: "gm-placeholder",
    name: "GM Placeholder",
  });

  await GameState.updateOne(
    { key: "main" },
    {
      $set: {
        globalClueIds: clueDocs.map((clue) => clue.clueId),
        deadCharacterIds: characterDocs
          .filter((character) => character.isDead)
          .map((character) => character.characterId),
      },
      $setOnInsert: {
        key: "main",
        currentRound: 1,
        roundStartedAt: new Date(),
        statuses: [],
      },
    },
    { upsert: true }
  );

  console.log(`Seed complete: ${characterDocs.length} characters, ${clueDocs.length} global clues, ${PLACEHOLDER_SHOP_ENTRIES.length} shop entries, and game state.`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
