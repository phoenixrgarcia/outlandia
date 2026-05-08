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
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  gm_alaric_arntrude: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  gm_percival_rondtabel: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  gm_wolfram_lodge: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  gm_noelle_nicaise: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  royalty_sabine_valois: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  royalty_yohan_valois: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  court_fitz_herald: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  court_livio_nivio: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  court_hugh_basterd: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  court_hildegund_hundolf: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_sigrid_tomb: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_raphael_regalis: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_van_ailsing: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_rabot_the_brave: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_durr_vinelight: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  guard_vudo_surebrick: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  alchemist_attila_bastian: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  alchemist_pax_patience: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  magician_olga_woodland_hearth: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  magician_volkran_channeler: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  magician_marion_bluthers: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  magician_penelope_pura: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  magician_calypso_caspian: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  clergy_raven_ratelm: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  clergy_sidonia_solomona: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  clergy_maura_mary_anna: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_solina_suspecta: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_wendela_lunites: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_tyrus_tithe: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_elisanna_einarr: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_una_urgellesa: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  worker_viktor_bastian: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_darwin_durand: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_valerius_shadow: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_justa_justice: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_quintina_quintius: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_liudmila_lefhild: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_isabel_einarr: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
  },
  street_dread_pirate_jewels: {
    passive: { name: {}, description: {} },
    active: { name: {}, description: {} },
    handlers: { passive: {}, active: {} },
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
