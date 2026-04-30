const PLACEHOLDER_FACTIONS = [
  "GMs",
  "Royalty",
  "Royal Court",
  "The Guards",
  "Alchemical Expressionist",
  "Magicians",
  "The Clergy",
  "The Workers",
  "The Streets"
];

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
  ["street_07", "Placeholder Street 07", "Fence", "The Streets"]
];

function createPlaceholderCharacter(seed, index) {
  const [id, name, characterClass, faction] = seed;
  const number = String(index + 1).padStart(2, "0");
  const isAdmin = faction === "GMs";

  return {
    id,
    name,
    player: "Player " + number,
    class: characterClass,
    className: characterClass,
    faction,
    publicBlurb: "TODO public character blurb placeholder for " + name + ".",
    blurb: "TODO public character blurb placeholder for " + name + ".",
    password: "10" + number,
    inventory: ["TODO inventory placeholder"],
    secret: "TODO secret placeholder.",
    twist: "TODO twist placeholder.",
    goals: ["TODO goal placeholder."],
    clues: ["TODO character clue placeholder."],
    privateInformation: "TODO private information placeholder.",
    relationships: ["TODO relationship placeholder."],
    money: index === 0 ? 0 : 25 + index * 5,
    isAdmin,
    canAdvanceRound: index === 0,
    isDead: id === "street_07",
    statuses: id === "street_07" ? ["Dead placeholder for UI testing"] : [],
    image: "default.png"
  };
}

const CHARACTERS = Object.fromEntries(
  PLACEHOLDER_CHARACTER_SEEDS.map((seed, index) => {
    const character = createPlaceholderCharacter(seed, index);
    return [character.id, character];
  })
);


// TODO Phase 2: replace this static list with GET /api/clues/global.
// Admin-revealed global clues should become public to everyone.
// Shop-purchased clues must remain private to the purchasing character and should not be merged into this global archive.
const DATABASE_PORTALS = [
  {
    id: "global-archive-record-01",
    title: "Global Archive Record 01",
    description: "TODO placeholder for an admin-revealed global clue record.",
    password: "archive01",
    href: "#",
    cta: "View Record",
    visibility: "global",
    apiRoute: "/api/clues/global",
    clue: "<p><b>TODO Global Clue Placeholder:</b> This record represents information that an admin may reveal to all players during the event.</p>"
  },
  {
    id: "global-archive-record-02",
    title: "Global Archive Record 02",
    description: "TODO placeholder for a public archive entry unlocked during play.",
    password: "archive02",
    href: "#",
    cta: "View Record",
    visibility: "global",
    apiRoute: "/api/clues/global",
    clue: "<p><b>TODO Archive Entry Placeholder:</b> Replace this with final public clue text after writers provide approved content.</p>"
  },
  {
    id: "global-archive-record-03",
    title: "Global Archive Record 03",
    description: "TODO placeholder for a sealed court archive record.",
    password: "archive03",
    href: "#",
    cta: "View Record",
    visibility: "global",
    apiRoute: "/api/clues/global",
    clue: "<p><b>TODO Sealed Record Placeholder:</b> This static record emulates a future admin-revealed global clue.</p>"
  },
  
];

function createCharacterDetails(
  player,
  character,
  occupationAndClothingTypeSuggestions,
  characterDetails,
  goals,
  abilities
) {
  return {
    player,
    character,
    occupationAndClothingTypeSuggestions,
    characterDetails,
    goals,
    abilities
  };
}

const CHARACTERS_DETAILED = Object.fromEntries(
  Object.values(CHARACTERS).map((character) => [
    character.id,
    createCharacterDetails(
      character.player,
      character.name,
      character.class,
      character.privateInformation,
      character.goals.join("\n\n"),
      character.clues.join("\n\n")
    )
  ])
);

document.addEventListener("alpine:init", () => {
  Alpine.store("auth", createAuthStore());
  Alpine.data("characterSelector", characterSelector);
  Alpine.data("charactersDisplay", charactersDisplay);
  Alpine.data("loggedInCharacterDetails", loggedInCharacterDetails);
});

function createAuthStore(){
  return{
    character: null,
    characters: CHARACTERS,
    characterDetails: CHARACTERS_DETAILED,
    showLogoutConfirm: false,

    init() {
      const storedCharacter = localStorage.getItem("loggedInCharacter");
      this.showLogoutConfirm = false;
      if(storedCharacter) {
        const character = JSON.parse(storedCharacter);

        if (this.characters[character.id]) {
          this.character = this.characters[character.id];
          localStorage.setItem("loggedInCharacter", JSON.stringify(this.character));
          return;
        }

        localStorage.removeItem("loggedInCharacter");
      }
    },

    get loggedIn() {
      return !!this.character;
    },

    get detailedCharacter() {
      if (!this.character) {
        return null;
      }

      return this.characterDetails[this.character.id] || null;
    },

     attemptLogin(characterId, password) {
      if (!characterId || !password) {
        alert("Please select a character and enter a password.");
        return;
      }

      const character = this.characters[characterId];

      if (!character || character.password !== password) {
        alert("Access denied. Incorrect password.");
        return;
      }

      this.character = character;
      localStorage.setItem("loggedInCharacter", JSON.stringify(character));
      alert(`Login successful! Welcome, ${character.name}.`);
    },

    requestLogout() {
      this.showLogoutConfirm = true;
    },

    cancelLogout() {
      this.showLogoutConfirm = false;
    },

    logout() {
      this.showLogoutConfirm = false;
      localStorage.removeItem("loggedInCharacter");
      this.character = null;
      alert("Character session closed.");
      window.location.href = "index.html";
    }
  }
}

function characterSelector() {
  return {
    characters: Object.values(CHARACTERS),
    selectedCharacterId: "",
    selectedCharacterPassword: "",
    query: "",
    resultsOpen: false,
    activeCharacterId: "",

    get selectedCharacter() {
      return CHARACTERS[this.selectedCharacterId] || null;
    },

    get filteredCharacters() {
      const search = this.normalizeSearch(this.query);

      if (!search) {
        return this.characters;
      }

      return this.characters.filter((character) => {
        return [
          character.name,
          character.player,
          this.getCharacterClass(character),
          character.faction
        ]
          .filter(Boolean)
          .some((value) => this.normalizeSearch(value).includes(search));
      });
    },

    get groupedResults() {
      const groups = {};

      this.filteredCharacters.forEach((character) => {
        const faction = character.faction || "Unaffiliated";

        if (!groups[faction]) {
          groups[faction] = [];
        }

        groups[faction].push(character);
      });

      return Object.entries(groups).map(([faction, characters]) => ({
        faction,
        characters
      }));
    },

    init() {
      const stored = localStorage.getItem("loggedInCharacter");

      if (stored) {
        const character = JSON.parse(stored);

        if (CHARACTERS[character.id]) {
          this.selectedCharacterId = character.id;
          this.query = CHARACTERS[character.id].name;
          this.activeCharacterId = character.id;
        }
      }
    },

    normalizeSearch(value) {
      return String(value || "").trim().toLowerCase();
    },

    getCharacterClass(character) {
      return character.class || character.className || character.role || character.publicBlurb || character.blurb || "Unassigned class";
    },

    openResults() {
      if (this.$store.auth.loggedIn) {
        return;
      }

      this.resultsOpen = true;

      if (!this.activeCharacterId && this.filteredCharacters.length) {
        this.activeCharacterId = this.filteredCharacters[0].id;
      }
    },

    closeResults() {
      this.resultsOpen = false;
    },

    handleSearchInput() {
      this.resultsOpen = true;
      this.selectedCharacterId = "";
      this.selectedCharacterPassword = "";
      this.activeCharacterId = this.filteredCharacters[0]?.id || "";
    },

    selectCharacter(character) {
      this.selectedCharacterId = character.id;
      this.query = character.name;
      this.activeCharacterId = character.id;
      this.selectedCharacterPassword = "";
      this.closeResults();
    },

    moveActive(direction) {
      if (!this.resultsOpen) {
        this.openResults();
      }

      const results = this.filteredCharacters;

      if (!results.length) {
        this.activeCharacterId = "";
        return;
      }

      const currentIndex = results.findIndex((character) => character.id === this.activeCharacterId);
      const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + direction + results.length) % results.length;

      this.activeCharacterId = results[nextIndex].id;
      this.scrollActiveIntoView();
    },

    selectActive() {
      if (!this.resultsOpen) {
        this.openResults();
        return;
      }

      const character = this.filteredCharacters.find((item) => item.id === this.activeCharacterId);

      if (character) {
        this.selectCharacter(character);
      }
    },

    scrollActiveIntoView() {
      this.$nextTick(() => {
        document
          .getElementById(`character-option-${this.activeCharacterId}`)
          ?.scrollIntoView({ block: "nearest" });
      });
    },

    loginOnClick() {
      this.$store.auth.attemptLogin(
        this.selectedCharacterId,
        this.selectedCharacterPassword
      );
    },
  };
}

function loggedInCharacterDetails() {
  return {
    sections: {
      inventory: false,
      goals: false,
      secret: false,
      twist: false,
      relationships: false,
      clues: false
    },

    get character() {
      return this.$store.auth.character;
    },

    get detailedCharacter() {
      return this.$store.auth.detailedCharacter;
    },

    toggleSection(section) {
      this.sections[section] = !this.sections[section];
    },

    formatMoney(value) {
      return `${Number(value || 0)} gold`;
    },

    formatText(text) {
      if (!text) {
        return "No information available.";
      }

      return this.escapeHtml(String(text)).replace(/\n/g, "<br>");
    },

    createListItems(value) {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
      }

      return String(value)
        .split(/\n\s*\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    },

    escapeHtml(text) {
      return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }
  };
}

function databaseAccess() {
  const storageKey = "databaseAccessState";

  return {
    portals: DATABASE_PORTALS.map((portal) => ({
      ...portal,
      value: "",
      unlocked: false,
      hasError: false
    })),

    init() {
      const storedState = localStorage.getItem(storageKey);

      if (!storedState) {
        return;
      }

      try {
        const portalState = JSON.parse(storedState);

        this.portals = this.portals.map((portal) => ({
          ...portal,
          unlocked: !!portalState[portal.id],
          hasError: false
        }));
      } catch (error) {
        localStorage.removeItem(storageKey);
      }
    },

    saveState() {
      const portalState = Object.fromEntries(
        this.portals.map((portal) => [portal.id, portal.unlocked])
      );

      localStorage.setItem(storageKey, JSON.stringify(portalState));
    },

    submitPortal(portal) {
      if (portal.unlocked) {
        window.location.href = portal.href;
        return;
      }

      if (portal.value === portal.password) {
        portal.unlocked = true;
        portal.hasError = false;
        portal.value = "";
        this.saveState();
        return;
      }

      portal.hasError = true;
    }
  };
}


// Characters display for the characters page
function charactersDisplay() {
  const characters = Object.values(CHARACTERS);
  const factionNames = PLACEHOLDER_FACTIONS.filter((factionName) =>
    characters.some((character) => character.faction === factionName)
  );
  const factions = factionNames.map((factionName) => ({
    id: factionName.toLowerCase().replaceAll(" ", "-"),
    name: factionName,
    characters: characters.filter((character) => character.faction === factionName)
  }));

  return {
    factions,
    query: "",
    openFactions: Object.fromEntries(factions.map((faction) => [faction.id, false])),

    get filteredFactions() {
      const search = this.normalizeSearch(this.query);

      if (!search) {
        return this.factions;
      }

      return this.factions
        .map((faction) => ({
          ...faction,
          characters: faction.characters.filter((character) => {
            return [
              character.name,
              character.player,
              character.class,
              character.faction,
              character.publicBlurb
            ]
              .filter(Boolean)
              .some((value) => this.normalizeSearch(value).includes(search));
          })
        }))
        .filter((faction) => faction.characters.length);
    },

    normalizeSearch(value) {
      return String(value || "").trim().toLowerCase();
    },

    syncOpenFactions() {
      const hasSearch = !!this.normalizeSearch(this.query);

      if (!hasSearch) {
        return;
      }

      this.filteredFactions.forEach((faction) => {
        this.openFactions[faction.id] = true;
      });
    },

    toggleFaction(factionId) {
      this.openFactions[factionId] = !this.openFactions[factionId];
    }
  };
}
