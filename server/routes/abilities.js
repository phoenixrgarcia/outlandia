const express = require("express");
const mongoose = require("mongoose");
const Character = require("../models/Character");
const EventLog = require("../models/EventLog");
const GameState = require("../models/GameState");
const { requireAuth } = require("../middleware/auth");
const { createAndEmitInboxMessage } = require("../services/inbox");
const { getCharacterAbilityDefinition } = require("../data/characterAbilities");
const { canAffordCurrency, normalizeCurrency, spendCurrency } = require("../utils/currency");
const { toSafeLoggedInCharacter } = require("../utils/characterPayload");

const router = express.Router();

function ensureDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database is not connected yet.",
    });
  }

  return next();
}

function abilityText(ability, handler) {
  return [
    ability?.name || "",
    ability?.description || "",
    handler?.todo || "",
  ].join(" ");
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function inferDie(ability, handler) {
  const text = abilityText(ability, handler);
  const match = text.match(/\bd(\d+)\b/i);

  return match ? Math.max(2, Number(match[1])) : null;
}

function inferTargetRules(ability, handler) {
  const name = ability?.name || "";
  const text = abilityText(ability, handler).toLowerCase();

  if (name === "Divine Challenge") {
    return { min: 2, max: 2 };
  }

  if (["Duel of Honor", "Pickpocket", "Plunder", "Salt Hex of Unluck"].includes(name)) {
    return { min: 1, max: 1 };
  }

  if (text.includes("two players") || text.includes("2 players")) {
    return { min: 2, max: 2 };
  }

  if (text.includes("group (3 max)") || text.includes("3 max")) {
    return { min: 1, max: 3 };
  }

  if (
    text.includes("send message to player") ||
    text.includes("choose a player") ||
    text.includes("target") ||
    text.includes("another player") ||
    text.includes("a player")
  ) {
    return { min: 1, max: 1 };
  }

  return { min: 0, max: 0 };
}

function inferSuspicionChange({ ability, handler, roll }) {
  const text = abilityText(ability, handler);
  const lowerText = text.toLowerCase();
  const changes = [];

  const userGainMatch = lowerText.match(/(?:and\s+)?gain\s+(\d+)\s+suspicion/);

  if (userGainMatch && !lowerText.includes("target gains")) {
    changes.push({
      appliesTo: "user",
      amount: Number(userGainMatch[1]),
      reason: "ability use",
    });
  }

  const targetGainMatch = lowerText.match(/target gains advantage[^.]*gains\s+(\d+)\s+suspicion/);

  if (targetGainMatch) {
    changes.push({
      appliesTo: "targets",
      amount: Number(targetGainMatch[1]),
      reason: "ability effect",
    });
  }

  if (roll && lowerText.includes("1-9: failure and gain 1 suspicion") && roll.value <= 9) {
    changes.push({
      appliesTo: "user",
      amount: 1,
      reason: "failed ability roll",
    });
  }

  return changes;
}

function formatCost(cost) {
  const pieces = [];

  if (cost.gold) {
    pieces.push(`${cost.gold} gold`);
  }

  if (cost.silver) {
    pieces.push(`${cost.silver} silver`);
  }

  return pieces.length ? pieces.join(", ") : "none";
}

function uniqueLines(lines) {
  const seen = new Set();

  return lines.filter((line) => {
    const normalized = String(line || "").trim();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function gmNoticeBody({
  character,
  ability,
  targets,
  cost,
  roll,
  rollResults = [],
  suspicionChanges,
  resolutionMessage = "",
  gmExtraLines = [],
}) {
  const targetNames = targets.length
    ? targets.map((target) => `${target.name} (${target.player || "Unknown player"})`).join(", ")
    : "Self / GM-resolved";
  const lines = [
    `Ability: ${ability.name}`,
    `Used by: ${character.name} (${character.player || "Unknown player"})`,
    `Targets: ${targetNames}`,
  ];

  if (cost.gold || cost.silver) {
    lines.push(`Cost: ${formatCost(cost)}`);
  }

  if (resolutionMessage) {
    lines.push(`Result: ${resolutionMessage.replace(/\s*A GM has been notified\.?\s*$/i, "").trim()}`);
  }

  if (roll && !resolutionMessage.toLowerCase().includes(`roll: ${roll.value}`)) {
    lines.push(`Roll: ${roll.value} on a d${roll.die}.`);
  }

  if (rollResults.length) {
    lines.push("Target rolls:");
    rollResults.forEach((result) => {
      lines.push(`- ${result.name}: ${result.value} on a d${result.die}`);
    });
  }

  suspicionChanges.forEach((change) => {
    const appliesTo = change.targetNames
      ? change.targetNames.join(", ")
      : change.appliesTo === "targets" && targets.length
      ? targets.map((target) => target.name).join(", ")
      : character.name;

    lines.push(`Suspicion change for ${appliesTo}: +${change.amount} (${change.reason}).`);
  });

  lines.push(...gmExtraLines);

  return uniqueLines(lines).join("\n");
}

async function notifyGms(body) {
  const gms = await Character.find({
    $or: [{ isAdmin: true }, { faction: "GMs" }],
  })
    .select("characterId")
    .lean();

  await Promise.all(
    gms.map((gm) =>
      createAndEmitInboxMessage({
        characterId: gm.characterId,
        title: "Ability Used",
        body,
        type: "gm_notice",
      }),
    ),
  );
}

async function getTargets(targetCharacterIds) {
  if (!targetCharacterIds.length) {
    return [];
  }

  return Character.find({
    characterId: { $in: targetCharacterIds },
    isAdmin: { $ne: true },
    faction: { $ne: "GMs" },
  })
    .select("characterId name player class faction")
    .lean();
}

async function getCurrentRound() {
  const gameState = await GameState.getSingleton().lean();

  return gameState?.currentRound || 1;
}

function isVolatileConcoction(character, ability) {
  return (
    character.characterId === "alchemist_pax_patience" &&
    ability?.name === "Volatile Concoction"
  );
}

function payoutForGoldAndItemRoll(roll) {
  if (roll === 6) {
    return "12 Gold and 1 item of theirs if available";
  }

  if (roll >= 3) {
    return "10 Gold";
  }

  return "8 Gold";
}

function payoutForPickpocketRoll(roll) {
  if (roll === 6) {
    return "8 Gold and 1 item in possession if available";
  }

  if (roll >= 4) {
    return "7 Gold";
  }

  return "4 Gold";
}

function experimentalPotionEffect(roll) {
  if (roll <= 2) {
    return "Fail next roll automatically";
  }

  if (roll <= 4) {
    return "+3 bonus to next roll";
  }

  return "+6 bonus to next roll";
}

function chaosSurgeEffect(roll) {
  return roll >= 4 ? "Double reward" : "+2 reward";
}

function detainDuration(roll) {
  if (roll <= 2) {
    return "2 minutes";
  }

  if (roll <= 4) {
    return "4 minutes";
  }

  return "6 minutes";
}

function abilityKindFromRequest(value) {
  return value === "passive" ? "passive" : "active";
}

function resultWithDefaults(result = {}) {
  return {
    roll: null,
    targetRolls: [],
    suspicionChanges: [],
    targetMessages: new Map(),
    message: "Ability used. A GM has been notified.",
    gmExtraLines: [],
    ...result,
  };
}

function resolveAbilityUse({ character, ability, handler, targets }) {
  const name = ability?.name || "";

  if (isVolatileConcoction(character, ability)) {
    return resultWithDefaults({
      targetMessages: new Map(targets.map((target) => [
        target.characterId,
        `${name} has been used on you.\n\nRoll a d20 in person with a GM. The lowest roll among the affected targets gains 1 suspicion token.`,
      ])),
      message: `${targets.length} target${targets.length === 1 ? "" : "s"} notified to roll d20 with a GM. The lowest roll gains 1 suspicion token.`,
      gmExtraLines: [
        "Affected targets should roll d20 in person. Lowest roll gains 1 suspicion token.",
      ],
    });
  }

  if (name === "Divine Challenge") {
    const payoutRoll = { die: 6, value: rollDie(6) };
    const payout = payoutForGoldAndItemRoll(payoutRoll.value);

    return resultWithDefaults({
      roll: payoutRoll,
      targetMessages: new Map(targets.map((target) => [
        target.characterId,
        `${name} has been used on you.\n\nRoll a contested d20 in person with a GM. The loser pays: ${payout}.`,
      ])),
      message: `Two targets notified to roll contested d20 with a GM. Payout roll: ${payoutRoll.value}, ${payout}. A GM has been notified.`,
      gmExtraLines: [
        "Targets should roll contested d20 in person with a GM.",
        `Payout roll: ${payoutRoll.value} on a d6. Result: ${payout}.`,
      ],
    });
  }

  if (name === "Duel of Honor") {
    const roll = { die: 20, value: rollDie(20) };

    return resultWithDefaults({
      roll,
      targetMessages: new Map(targets.map((target) => [
        target.characterId,
        `${name} has been used on you by ${character.name}.\n\n${character.name} rolled ${roll.value} on a d20. Roll your own d20 in person with a GM. Loser gives the winner 10 Gold OR 1 Favor.`,
      ])),
      message: `You rolled ${roll.value} on a d20. The target has been notified to roll their d20 in person with a GM.`,
    });
  }

  if (name === "Pickpocket") {
    const roll = { die: 20, value: rollDie(20) };
    const payoutRoll = roll.value >= 10 ? { die: 6, value: rollDie(6) } : null;
    const suspicionChanges = roll.value < 10
      ? [{ appliesTo: "user", amount: 1, reason: "failed Pickpocket roll" }]
      : [];
    const notified = roll.value >= 10 && roll.value <= 15;
    const payout = payoutRoll ? payoutForPickpocketRoll(payoutRoll.value) : "";
    const outcome = roll.value >= 16
      ? `Clean break. Payout roll: ${payoutRoll.value}, ${payout}.`
      : roll.value >= 10
      ? `Success, but victim is notified. Payout roll: ${payoutRoll.value}, ${payout}.`
      : "Failed. GM should assign +1 suspicion.";

    return resultWithDefaults({
      roll,
      suspicionChanges,
      targetMessages: notified
        ? new Map(targets.map((target) => [
            target.characterId,
            `You notice that someone attempted to pickpocket you. Talk to a GM for resolution.`,
          ]))
        : new Map(),
      message: `Pickpocket d20: ${roll.value}. ${outcome} A GM has been notified.`,
      gmExtraLines: payoutRoll ? [`Payout roll: ${payoutRoll.value} on a d6. Result: ${payout}.`] : [],
    });
  }

  if (name === "Experimental Draft Potion") {
    return resultWithDefaults({
      targetMessages: new Map(targets.map((target) => [
        target.characterId,
        `${name} has been used on you.\n\nRoll a d6 in person with a GM.\n1-2: ${experimentalPotionEffect(1)}\n3-4: ${experimentalPotionEffect(3)}\n5-6: ${experimentalPotionEffect(5)}`,
      ])),
      message: "Target notified to roll a d6 with a GM for the potion effect.",
      gmExtraLines: [
        "Target rolls d6: 1-2 = fail next roll automatically, 3-4 = +3 bonus to roll, 5-6 = +6 bonus to roll.",
      ],
    });
  }

  if (name === "Plunder") {
    const roll = { die: 6, value: rollDie(6) };
    const payout = payoutForGoldAndItemRoll(roll.value);

    return resultWithDefaults({
      roll,
      suspicionChanges: [{ appliesTo: "user", amount: 1, reason: "Plunder ability use" }],
      message: `Plunder roll: ${roll.value}. Result: ${payout}. GM should assign +1 suspicion.`,
      gmExtraLines: [`Payout result: ${payout}. GM should distribute funds/items as needed.`],
    });
  }

  if (name === "Salt Hex of Unluck") {
    return resultWithDefaults({
      targetMessages: new Map(targets.map((target) => [
        target.characterId,
        `${name} has been used on you.\n\nRoll a d6 in person with a GM.\n4+: Hex has no effect.\n1-3: Gain 1 suspicion and disadvantage.`,
      ])),
      message: "Target notified to roll a d6 with a GM for Salt Hex resolution.",
      gmExtraLines: [
        "Target rolls d6: 4+ = hex has no effect, 1-3 = gain 1 suspicion and disadvantage.",
      ],
    });
  }

  if (name === "Chaos Surge") {
    const roll = { die: 6, value: rollDie(6) };

    return resultWithDefaults({
      roll,
      message: `Chaos Surge roll: ${roll.value}. Result: ${chaosSurgeEffect(roll.value)}. A GM has been notified.`,
      gmExtraLines: [`Chaos Surge result: ${chaosSurgeEffect(roll.value)}.`],
    });
  }

  if (name === "Detain/Release") {
    const roll = { die: 20, value: rollDie(20) };
    const durationRoll = roll.value >= 12 ? { die: 6, value: rollDie(6) } : null;
    const duration = durationRoll ? detainDuration(durationRoll.value) : "";

    return resultWithDefaults({
      roll,
      suspicionChanges: [{ appliesTo: "user", amount: 1, reason: "Detain/Release ability use" }],
      targetMessages: roll.value >= 12
        ? new Map(targets.map((target) => [
            target.characterId,
            `${name} has been used on you.\n\nAbility check succeeded. Duration: ${duration}. Talk to a GM for resolution.`,
          ]))
        : new Map(),
      message: roll.value >= 12
        ? `Ability check: ${roll.value} on d20, success. Duration roll: ${durationRoll.value}, ${duration}. GM should assign +1 suspicion.`
        : `Ability check: ${roll.value} on d20, failed. GM should assign +1 suspicion.`,
      gmExtraLines: durationRoll ? [`Duration roll: ${durationRoll.value} on a d6. Duration: ${duration}.`] : [],
    });
  }

  if (name === "Pity Trade") {
    const roll = { die: 6, value: rollDie(6) };

    return resultWithDefaults({
      roll,
      message: `Pity Trade roll: ${roll.value}. Each nearby player gives ${roll.value} Silver. Transactions should be done through a GM.`,
      gmExtraLines: [`Each nearby player gives ${character.name} ${roll.value} Silver.`],
    });
  }

  if (name === "Slip Through") {
    return resultWithDefaults({
      message: "If anyone tries to detect you, they should roll a d6 with a GM. 1-2: they detect you. 3-4: avoid detection for the next 3 minutes. 5-6: no detection.",
      gmExtraLines: [
        "Detection roll table: 1-2 = they detect the player, 3-4 = avoid detection for the next 3 minutes, 5-6 = no detection.",
      ],
    });
  }

  const die = inferDie(ability, handler);
  const roll = die
    ? {
        die,
        value: rollDie(die),
      }
    : null;

  return resultWithDefaults({
    roll,
    suspicionChanges: inferSuspicionChange({ ability, handler, roll }),
    targetMessages: new Map(targets.map((target) => [
      target.characterId,
      `${name} has been used on you.\n\n${ability.description || "Talk to a GM for the effect."}`,
    ])),
    message: roll
      ? `Rolled ${roll.value} on a d${roll.die}. A GM has been notified.`
      : "Ability used. A GM has been notified.",
  });
}

router.post("/:abilityType/use", requireAuth, ensureDatabase, async (req, res, next) => {
  try {
    const character = await Character.findOne({ characterId: req.auth.characterId });

    if (!character) {
      return res.status(404).json({
        error: "Character not found.",
      });
    }

    if (character.isAdmin || character.faction === "GMs") {
      return res.status(400).json({
        error: "GM/admin characters cannot use gameplay abilities.",
      });
    }

    const abilityType = abilityKindFromRequest(req.params.abilityType);
    const abilityDefinition = getCharacterAbilityDefinition(character.characterId);
    const ability = abilityDefinition[abilityType];
    const handler = abilityDefinition.handlers?.[abilityType] || {};

    if (!ability?.name) {
      return res.status(400).json({
        error: `This character does not have a ${abilityType} ability configured.`,
      });
    }

    const round = await getCurrentRound();
    const text = abilityText(ability, handler).toLowerCase();

    if (text.includes("once per round")) {
      const existingUse = await EventLog.exists({
        action: `ability.${abilityType}.used`,
        actorCharacterId: character.characterId,
        targetId: ability.name,
        "details.round": round,
      });

      if (existingUse) {
        return res.status(400).json({
          error: "This ability has already been used this round.",
        });
      }
    }

    const cost = normalizeCurrency(ability.cost || {});

    if (!canAffordCurrency(character.money, cost)) {
      return res.status(400).json({
        error: "Not enough currency to use this ability.",
      });
    }

    const targetCharacterIds = [...new Set(
      (Array.isArray(req.body.targetCharacterIds) ? req.body.targetCharacterIds : [])
        .map((id) => String(id || "").trim().toLowerCase())
        .filter(Boolean)
        .filter((id) => id !== character.characterId),
    )];
    const targetRules = inferTargetRules(ability, handler);

    if (targetCharacterIds.length < targetRules.min) {
      return res.status(400).json({
        error: targetRules.min === 1
          ? "Choose a target for this ability."
          : `Choose ${targetRules.min} targets for this ability.`,
      });
    }

    if (targetRules.max && targetCharacterIds.length > targetRules.max) {
      return res.status(400).json({
        error: `Choose no more than ${targetRules.max} targets for this ability.`,
      });
    }

    const targets = await getTargets(targetCharacterIds.slice(0, targetRules.max || targetCharacterIds.length));

    if (targets.length < Math.min(targetCharacterIds.length, targetRules.max || targetCharacterIds.length)) {
      return res.status(400).json({
        error: "One or more selected targets are unavailable.",
      });
    }

    const previousMoney = normalizeCurrency(character.money);
    character.money = spendCurrency(character.money, cost);
    character.markModified("money");

    const resolution = resolveAbilityUse({ character, ability, handler, targets });
    const gmBody = gmNoticeBody({
      character,
      ability,
      targets,
      cost,
      roll: resolution.roll,
      rollResults: resolution.targetRolls,
      suspicionChanges: resolution.suspicionChanges,
      resolutionMessage: resolution.message,
      gmExtraLines: resolution.gmExtraLines,
    });

    await character.save();

    await notifyGms(gmBody);

    await Promise.all(
      targets
        .filter((target) => resolution.targetMessages.has(target.characterId))
        .map((target) =>
          createAndEmitInboxMessage({
            characterId: target.characterId,
            title: "Ability Effect",
            body: resolution.targetMessages.get(target.characterId),
            type: "ability",
          }),
        ),
    );

    await createAndEmitInboxMessage({
      characterId: character.characterId,
      title: "Ability Used",
      body: `${ability.name}: ${resolution.message}`,
      type: "ability",
      oldState: {
        money: previousMoney,
      },
      newState: {
        money: normalizeCurrency(character.money),
        ability: ability.name,
        roll: resolution.roll,
        targetRolls: resolution.targetRolls,
      },
    });

    await EventLog.create({
      action: `ability.${abilityType}.used`,
      actorCharacterId: character.characterId,
      targetType: "ability",
      targetId: ability.name,
      details: {
        round,
        cost,
        previousMoney,
        nextMoney: normalizeCurrency(character.money),
        targetCharacterIds: targets.map((target) => target.characterId),
        roll: resolution.roll,
        targetRolls: resolution.targetRolls,
        suspicionChanges: resolution.suspicionChanges,
      },
    });

    return res.json({
      character: toSafeLoggedInCharacter(character),
      result: {
        abilityName: ability.name,
        cost,
        roll: resolution.roll,
        targetRolls: resolution.targetRolls,
        targetCount: targets.length,
        suspicionChanges: resolution.suspicionChanges,
        message: resolution.message,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
