const { currency } = require("../utils/currency");

const DEFAULT_CHARACTER_ABILITIES = {
  passive: null,
  active: null,
  handlers: {},
};

const CHARACTER_ABILITIES = {
  // Add character-specific abilities here, keyed by Character.characterId.
  // Example:
  // royalty_01: {
  //   passive: {
  //     name: "Royal Bearing",
  //     description: "You may privately ask a GM whether a noble title is legitimate.",
  //   },
  //   active: {
  //     name: "Command Audience",
  //     description: "Once per round, compel one character to meet with you publicly.",
  //   },
  //   handlers: {
  //     active: async ({ character, targetCharacterId }) => {
  //       return { characterId: character.characterId, targetCharacterId };
  //     },
  //   },
  // },

  gm_abbo_arnulf: {
    passive: { name: "", description: "" },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  gm_alaric_arntrude: {
    passive: { name: "", description: "" },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  gm_percival_rondtabel: {
    passive: { name: "", description: "" },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  gm_wolfram_lodge: {
    passive: { name: "", description: "" },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  gm_noelle_nicaise: {
    passive: { name: "", description: "" },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  royalty_sabine_valois: {
    passive: {
      name: "Queen's Grace",
      description:
        "+2 to interrogation/deception rolls. Apply these bonuses yourself when rolling.",
    },
    active: {
      name: "Royal Authority",
      description:
        "Once per round, force two players into a public interaction (must either bribe or interrogate each other). Cost: 10 Gold and gain 1 suspicion.",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: { todo: "send message to two players" } },
  },
  royalty_yohan_valois: {
    passive: {
      name: "King's Presence",
      description:
        "Immune to theft unless on critical success. Dispute discrepencies with GMs. ",
    },
    active: {
      name: "Crown's Pardon",
      description:
        "Once per round, cancel the result of any failed roll (yours or another's) and reroll it. Cost: 10 Gold or 1 Favor",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  court_fitz_herald: {
    passive: {
      name: "Watchful Instinct",
      description:
        "When shown a document or order you can ask a GM: “Does this follow procedure”. The GM will answer: Yes - Legitimate, No - Something is off",
    },
    active: {
      name: "Marked Shot",
      description:
        "Choose a player, the next action made against them gains +5. Notify a GM or the target when using this ability. Cost: 4 Gold  ",
      cost: currency(4, 0),
    },
    handlers: { passive: {}, active: { todo: "send message to player" } },
  },
  court_livio_nivio: {
    passive: {
      name: "Material Expertise",
      description:
        "You can tell how heat, force, or chemicals affect an object. (clue)",
    },
    active: {
      name: "Hidden Plate",
      description:
        "Ignore one negative effect (suspicion penalty, bribe, hex, etc.) Cost: 8 Gold",
      cost: currency(8, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  court_hugh_basterd: {
    passive: {
      name: "Penny for your thoughts",
      description: "Gain 1 silver when rumors catch on (your or another's)",
    },
    active: {
      name: "Silver Tongue",
      description:
        "Add +5 to any bribe or interrogation roll (yours or another's). Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  court_hildegund_hundolf: {
    passive: { name: "", description: "" },
    active: {
      name: "Suspicious Writing",
      description:
        "Mark a player's statement, if it is later proven false, they will gain a suspicion token. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  guard_sigrid_tomb: {
    passive: {
      name: "",
      description: "",
    },
    active: {
      name: "Detain/Release",
      description:
        "Roll d20. On 12+, choose between Detain or Release, then roll d6 for duration: 1-2 = 2 minutes, 3-4 = 4 minutes, 5-6 = 6 minutes. Cost: 10 Gold, gain 1 suspicion.",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: { todo: "roll d6. Display result" } },
  },
  guard_raphael_regalis: {
    passive: { name: "", description: "" },
    active: {
      name: "Intimidating Interrogation",
      description:
        "Gain advantage +2 in an interrogation AND target cannot give a false answer on success, but gain 1 suspicion. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  guard_van_ailsing: {
    passive: { name: "", description: "" },
    active: {
      name: "Duel of Honor",
      description:
        "Challenge a player to a duel. You roll d20 in the app; the target is notified to roll d20 in person with a GM. Loser gives the winner 10 Gold OR 1 Favor. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  guard_rabot_the_brave: {
    passive: { name: "", description: "" },
    active: {
      name: "Shield Ally",
      description:
        "Take the effect of an ability meant for another. Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  guard_durr_vinelight: {
    passive: { name: "", description: "" },
    active: {
      name: "Oathbound Honesty",
      description:
        "Target must answer one question truthfully (GM enforced) OR may take 1 suspicion token to resist. Cost: 12 Gold, and cannot lie for the remainder of the round",
      cost: currency(12, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  guard_vudo_surebrick: {
    passive: { name: "", description: "" },
    active: {
      name: "Patrol Eye",
      description:
        "Gain a list of who targeted a player last round. Ask GMs to reveal this information. Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  alchemist_attila_bastian: {
    passive: {
      name: "Inspect Element",
      description:
        "Analyze any residual evidence and instantly pinpoint if its makeup is familiar to you",
    },
    active: {
      name: "Experimental Draft Potion",
      description: "Target rolls d6: 1-2 = fail next roll automatically, 3-4 = +3 bonus to roll, 5-6 = +6 bonus to roll. Cost: 8 Gold",
      cost: currency(8, 0),
    },
    handlers: {
      passive: {},
      active: { todo: "roll a d6, then send message to player" },
    },
  },
  alchemist_pax_patience: {
    passive: {
      name: "Wild Accusation",
      description:
        "Make a wild claim about another player. Roll d20, on success GM confirms it true.",
    },
    active: {
      name: "Volatile Concoction",
      description:
        "Force all players in a group (3 max) to roll d20; lowest gains 1 suspicion token. Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  magician_olga_woodland_hearth: {
    passive: {
      name: "Curse Residue",
      description:
        "When inspecting objects you can tell if it has been used in harm, poison, or betrayal.",
    },
    active: {
      name: "Salt Hex of Unluck",
      description:
        "Opponent rolls d6: 4+ = hex has no effect, 1-3 = gain 1 suspicion and disadvantage. Cost: 5 Gold, or 1 Favor",
    },
    handlers: { passive: {}, active: {} },
  },
  magician_volkran_channeler: {
    passive: { name: "", description: "" },
    active: {
      name: "Chaos Surge",
      description:
        "Roll d6: 1-3 = +2 reward, 4-6 = double reward. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: {
      passive: {},
      active: {
        todo: "roll a d6 and apply the result to the next bribe/interrogation reward",
      },
    },
  },
  magician_marion_bluthers: {
    passive: { name: "", description: "" },
    active: {
      name: "Whispered Pact",
      description:
        "Force a player to reveal if they've lied this round, they have to truthfully answer yes/no OR take 2 suspicion tokens. Cost: 5 Gold and gain 1 suspicion",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  magician_penelope_pura: {
    passive: { name: "", description: "" },
    active: {
      name: "Dreamwalk",
      description:
        "Secretly view one player's last action (via GM). Cost: 8 Gold",
      cost: currency(8, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  magician_calypso_caspian: {
    passive: { name: "", description: "" },
    active: {
      name: "Siren's Call",
      description:
        "Force a player to either: Give 10 Gold or gain 2 Suspicion tokens. Cost: 10 Gold",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  clergy_raven_ratelm: {
    passive: { name: "", description: "" },
    active: {
      name: "Flashbang",
      description:
        "Force a player to reroll an interrogation result. Cost: 8 Gold",
      cost: currency(8, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  clergy_sidonia_solomona: {
    passive: { name: "", description: "" },
    active: {
      name: "Dusk's Veil",
      description:
        "Negate suspicion gain for one action (yours or another's). Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  clergy_maura_mary_anna: {
    passive: { name: "", description: "" },
    active: {
      name: "Divine Challenge",
      description:
        "Force a contested d20 between two players. Loser pays you based on d6: 6 = 12 Gold and 1 item if available, 3-5 = 10 Gold, 1-2 = 8 Gold. Cost: 10 Gold",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: { todo: "add d6 roll" } },
  },
  worker_solina_suspecta: {
    passive: { name: "", description: "" },
    active: {
      name: "Liquid Courage",
      description:
        "Target gains advantage on next roll but gains 1 Suspicion token. Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  worker_wendela_lunites: {
    passive: { name: "", description: "" },
    active: {
      name: "Feed Trust",
      description:
        "Remove 1 Suspicion token from a player and gain 1 Favor if target had greater than 1 suspicion. Cost: 7 Gold",
      cost: currency(7, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  worker_tyrus_tithe: {
    passive: { name: "", description: "" },
    active: {
      name: "Reinforced Nerve",
      description: "Give +4 to next roll (yours or another's). Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  worker_elisanna_einarr: {
    passive: {
      name: "Footprint Analysis",
      description:
        "Immediately identify any footprint (clue) you're given or find.",
    },
    active: {
      name: "Quiet Step",
      description: "Target avoids being targeted for one round. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  worker_una_urgellesa: {
    passive: {
      name: "Broadcast",
      description: "1 announcement every round.",
    },
    active: {
      name: "Timely Announcement",
      description:
        "Force all players to publicly declare their current gold. Cost: 6 Gold",
      cost: currency(6, 0),
    },
    handlers: { passive: {}, active: {} },
  },
  worker_viktor_bastian: {
    passive: { name: "", description: "" },
    active: {
      name: "Rumor Mill",
      description:
        "Spread a rumor; the subject(s) of the rumor gain disadvantage unless they pay 5 Gold. Cost: 5 Gold",
      cost: currency(5, 0),
    },
    handlers: { passive: {}, active: { todo: "message 2 players" } },
  },
  street_darwin_durand: {
    passive: {
      name: "Pity Trade",
      description:
        "Roll d6; each nearby player gives you that much silver. 1 = 1 Silver, 2 = 2 Silver, and so on. Transactions done through GM",
    },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  street_valerius_shadow: {
    passive: {
      name: "Slip Through",
      description:
        "If anyone tries to detect you, roll d6. 1-2 = they detect you, 3-4 = avoid detection for the next 3 minutes, 5-6 = no detection.",
    },
    active: {
      name: "Pickpocket",
      description:
        "Attempt to steal gold and items. d20: 16-20 = clean break, 10-15 = victim is notified, <10 = fail. On success, d6 payout: 1-3 = 4 Gold, 4-5 = 7 Gold, 6 = 8 Gold and 1 item in possession if available.",
    },
    handlers: { passive: {}, active: { todo: "roll d20 and do result" } },
  },
  street_justa_justice: {
    passive: {
      name: "Blackmail",
      description:
        "If you've successfully interrogated someone before, auto-succeed a bribe against them. Resets each use, but get double use for nat 20 result on interrogation. Cost: 7 Gold",
    },
    active: { name: "", description: "" },
    handlers: { passive: {}, active: {} },
  },
  street_quintina_quintius: {
    passive: {
      name: "Second Take",
      description: "Immediately repeat a failed theft or bribery attempt once.",
    },
    active: {
      name: "Pickpocket",
      description:
        "Attempt to steal gold and items. d20: 16-20 = clean break, 10-15 = victim is notified, <10 = fail. On success, d6 payout: 1-3 = 4 Gold, 4-5 = 7 Gold, 6 = 8 Gold and 1 item in possession if available.",
    },
    handlers: { passive: {}, active: { todo: "roll d20 and do result" } },
  },
  street_liudmila_lefhild: {
    passive: { name: "", description: "" },
    active: {
      name: "Ritual Mark",
      description:
        "Sacrifice 1 Favor token to give 2 Suspicion tokens to others (split as desired). Execute through a GM. Cost: 1 Favor",
    },
    handlers: { passive: {}, active: {} },
  },
  street_isabel_einarr: {
    passive: { name: "", description: "" },
    active: {
      name: "Silent Insight",
      description:
        "Ask a GM a yes/no question about a player's role or action. Cost: 1 Favor",
    },
    handlers: { passive: {}, active: {} },
  },
  street_dread_pirate_jewels: {
    passive: { name: "", description: "" },
    active: {
      name: "Plunder",
      description:
        "Roll d6 and steal from a player: 6 = 12 Gold and 1 item if available, 3-5 = 10 Gold, 1-2 = 8 Gold. Cost: 10 Gold and gain 1 Suspicion token",
      cost: currency(10, 0),
    },
    handlers: { passive: {}, active: { todo: "roll d6 and apply result" } },
  },
};

function normalizeCharacterId(characterId) {
  return String(characterId || "")
    .trim()
    .toLowerCase();
}

function serializeAbility(ability) {
  if (!ability) {
    return null;
  }

  if (typeof ability === "string") {
    return {
      name: "",
      description: ability,
    };
  }

  return {
    name: ability.name || "",
    description: ability.description || "",
    cost: ability.cost || null,
  };
}

function getCharacterAbilityDefinition(characterId) {
  return (
    CHARACTER_ABILITIES[normalizeCharacterId(characterId)] ||
    DEFAULT_CHARACTER_ABILITIES
  );
}

function getSerializableCharacterAbilities(characterId) {
  const abilities = getCharacterAbilityDefinition(characterId);

  return {
    passive: serializeAbility(abilities.passive),
    active: serializeAbility(abilities.active),
  };
}

function getCharacterAbilityHandlers(characterId) {
  return getCharacterAbilityDefinition(characterId).handlers || {};
}

module.exports = {
  CHARACTER_ABILITIES,
  getCharacterAbilityDefinition,
  getCharacterAbilityHandlers,
  getSerializableCharacterAbilities,
};
