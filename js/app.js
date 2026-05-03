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

const AUTH_TOKEN_STORAGE_KEY = "outlandiaAuthToken";
const LEGACY_CHARACTER_STORAGE_KEY = "loggedInCharacter";

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

  return {
    id,
    name,
    player: "Player " + number,
    class: characterClass,
    className: characterClass,
    faction,
    publicBlurb: "TODO public character blurb placeholder for " + name + ".",
    blurb: "TODO public character blurb placeholder for " + name + ".",
    isDead: id === "street_07",
    image: "default.png"
  };
}

const CHARACTERS = Object.fromEntries(
  PLACEHOLDER_CHARACTER_SEEDS.map((seed, index) => {
    const character = createPlaceholderCharacter(seed, index);
    return [character.id, character];
  })
);


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

const CHARACTERS_DETAILED = {};

document.addEventListener("alpine:init", () => {
  Alpine.store("auth", createAuthStore());
  Alpine.data("characterSelector", characterSelector);
  Alpine.data("charactersDisplay", charactersDisplay);
  Alpine.data("loggedInCharacterDetails", loggedInCharacterDetails);
  Alpine.data("adminDashboard", adminDashboard);
});

function createAuthStore(){
  return{
    character: null,
    characters: {},
    characterDetails: CHARACTERS_DETAILED,
    authToken: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "",
    error: "",
    isLoadingCharacters: false,
    isRestoringSession: false,
    isLoggingIn: false,
    showLogoutConfirm: false,

    async init() {
      this.showLogoutConfirm = false;
      localStorage.removeItem(LEGACY_CHARACTER_STORAGE_KEY);
      await this.fetchPublicCharacters();

      if (this.authToken) {
        await this.restoreSessionFromToken();
      }
    },

    get loggedIn() {
      return !!this.character;
    },

    get detailedCharacter() {
      return this.character;
    },

    async fetchPublicCharacters() {
      this.isLoadingCharacters = true;
      this.error = "";

      try {
        const response = await fetch("/api/characters/public");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load the character roster.");
        }

        this.characters = Object.fromEntries(
          data.characters.map((character) => [character.id, character])
        );
      } catch (error) {
        this.characters = {};
        this.error = error.message || "Unable to load the character roster.";
      } finally {
        this.isLoadingCharacters = false;
      }
    },

    async restoreSessionFromToken() {
      this.isRestoringSession = true;

      try {
        const response = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Token restore failed.");
        }

        const data = await response.json();
        this.character = data.character;
      } catch (error) {
        this.clearSession();
      } finally {
        this.isRestoringSession = false;
      }
    },

    async attemptLogin(characterId, password) {
      this.error = "";

      if (!characterId || !password) {
        this.showLoginError("Please select a character and enter a password.");
        return;
      }

      this.isLoggingIn = true;

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ characterId, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          this.showLoginError(data.error || "Access denied. Incorrect password.");
          return;
        }

        this.authToken = data.token;
        this.character = data.character;
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
        alert(`Login successful! Welcome, ${data.character.name}.`);
      } catch (error) {
        this.showLoginError("Unable to reach the login service. Please try again.");
      } finally {
        this.isLoggingIn = false;
      }
    },

    showLoginError(message) {
      this.error = message;
      alert(message);
    },

    requestLogout() {
      this.showLogoutConfirm = true;
    },

    cancelLogout() {
      this.showLogoutConfirm = false;
    },

    logout() {
      this.showLogoutConfirm = false;
      this.clearSession();
      alert("Character session closed.");
      window.location.href = "index.html";
    },

    clearSession() {
      this.authToken = "";
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CHARACTER_STORAGE_KEY);
      this.character = null;
    }
  }
}

function characterSelector() {
  return {
    selectedCharacterId: "",
    selectedCharacterPassword: "",
    query: "",
    resultsOpen: false,
    activeCharacterId: "",

    get characters() {
      return Object.values(this.$store.auth.characters);
    },

    get selectedCharacter() {
      return this.$store.auth.characters[this.selectedCharacterId] || null;
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
      if (this.$store.auth.character) {
        this.selectedCharacterId = this.$store.auth.character.id;
        this.query = this.$store.auth.character.name;
        this.activeCharacterId = this.$store.auth.character.id;
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
        return value.map((item) => this.formatListItem(item)).filter(Boolean);
      }

      return String(value)
        .split(/\n\s*\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    },

    formatListItem(item) {
      if (!item) {
        return "";
      }

      if (typeof item === "object") {
        return [item.name, item.note, item.description]
          .filter(Boolean)
          .join(": ")
          .trim();
      }

      return String(item).trim();
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
  return {
    clues: [],
    isLoading: true,
    error: "",

    async init() {
      await this.loadGlobalClues();
    },

    async loadGlobalClues() {
      this.isLoading = true;
      this.error = "";

      try {
        const response = await fetch("/api/clues/global");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load the Court Archive.");
        }

        this.clues = data.clues;
      } catch (error) {
        this.error = error.message || "Unable to load the Court Archive.";
      } finally {
        this.isLoading = false;
      }
    },

    formatArchiveBody(body) {
      return this.escapeHtml(body || "No archive text available.").replace(/\n/g, "<br>");
    },

    escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    },
  };
}

function adminDashboard() {
  return {
    isLoading: true,
    error: "",
    notice: "",
    summary: null,
    characters: [],
    clues: [],
    characterSearch: "",
    activeAdminTab: "overview",

    async init() {
      await Promise.all([
        this.loadSummary(),
        this.loadCharacters(),
        this.loadClues(),
      ]);
    },

    get token() {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    },

    async adminRequest(path, options = {}) {
      if (!this.token) {
        throw new Error("Log in as an admin character to use admin controls.");
      }

      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(options.headers || {}),
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Admin action failed.");
      }

      return data;
    },

    async loadSummary() {
      this.isLoading = true;
      this.error = "";

      try {
        if (!this.token) {
          this.error = "Log in as an admin character to view the admin dashboard.";
          return;
        }

        const response = await fetch("/api/admin/summary", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          this.error = data.error || "Admin dashboard access denied.";
          return;
        }

        this.summary = data;
      } catch (error) {
        this.error = "Unable to load the admin dashboard.";
      } finally {
        this.isLoading = false;
      }
    },

    async loadCharacters() {
      try {
        if (!this.token) {
          this.characters = [];
          return;
        }

        const response = await fetch("/api/admin/characters", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          this.characters = [];
          return;
        }

        this.characters = data.characters;
      } catch (error) {
        this.characters = [];
      }
    },

    async loadClues() {
      try {
        if (!this.token) {
          this.clues = [];
          return;
        }

        const response = await fetch("/api/admin/clues", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          this.clues = [];
          return;
        }

        this.clues = data.clues;
      } catch (error) {
        this.clues = [];
      }
    },

    async refetchAdminState() {
      await Promise.all([
        this.loadSummary(),
        this.loadCharacters(),
        this.loadClues(),
      ]);
    },

    async mutate(action) {
      this.error = "";
      this.notice = "";

      try {
        await action();
        await this.refetchAdminState();
        this.notice = "Admin update saved.";
      } catch (error) {
        this.error = error.message || "Admin update failed.";
      }
    },

    updateMoney(characterId, money) {
      return this.mutate(() => this.adminRequest(`/api/admin/characters/${characterId}/money`, {
        method: "PATCH",
        body: JSON.stringify({ money: Number(money) }),
      }));
    },

    updateInventory(characterId, inventoryText) {
      const inventory = String(inventoryText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [namePart, quantityPart] = line.split("|").map((part) => part.trim());
          return {
            name: namePart,
            quantity: quantityPart ? Number(quantityPart) : 1,
          };
        });

      return this.mutate(() => this.adminRequest(`/api/admin/characters/${characterId}/inventory`, {
        method: "PATCH",
        body: JSON.stringify({ inventory }),
      }));
    },

    toggleDeath(character) {
      return this.mutate(() => this.adminRequest(`/api/admin/characters/${character.id}/death`, {
        method: "PATCH",
        body: JSON.stringify({ isDead: !character.isDead }),
      }));
    },

    addStatus(characterId, statusName, statusNote) {
      return this.mutate(() => this.adminRequest(`/api/admin/characters/${characterId}/statuses`, {
        method: "POST",
        body: JSON.stringify({ name: statusName, note: statusNote }),
      }));
    },

    removeStatus(characterId, statusId) {
      return this.mutate(() => this.adminRequest(`/api/admin/characters/${characterId}/statuses/${statusId}`, {
        method: "DELETE",
      }));
    },

    consumeModifier(characterId, modifierId) {
      return this.mutate(() => this.adminRequest(`/api/admin/modifiers/${modifierId}/consume`, {
        method: "POST",
        body: JSON.stringify({ characterId }),
      }));
    },

    revealClue(clue) {
      return this.mutate(() => this.adminRequest(`/api/admin/clues/${clue.id}/reveal`, {
        method: "PATCH",
        body: JSON.stringify({ isRevealedGlobally: !clue.isRevealedGlobally }),
      }));
    },

    get totalCharacters() {
      return this.characters.length || this.summary?.characters?.length || 0;
    },

    get deadCharacters() {
      return this.characters.filter((character) => character.isDead);
    },

    get adminCharacters() {
      return this.characters.filter((character) => character.isAdmin);
    },

    get roundAdvancers() {
      return this.characters.filter((character) => character.canAdvanceRound);
    },

    get filteredCharacters() {
      const search = this.normalizeSearch(this.characterSearch);

      if (!search) {
        return this.characters;
      }

      return this.characters.filter((character) => {
        return [character.name, character.player]
          .filter(Boolean)
          .some((value) => this.normalizeSearch(value).includes(search));
      });
    },

    get globalClueCount() {
      const globalClues = this.summary?.clueCounts?.find((item) => item.type === "global");
      return globalClues?.count || 0;
    },

    get globalClues() {
      return this.clues.filter((clue) => clue.clueType === "global");
    },

    inventoryText(character) {
      return (character.inventory || [])
        .map((item) => `${item.name}${item.quantity && item.quantity !== 1 ? ` | ${item.quantity}` : ""}`)
        .join("\n");
    },

    normalizeSearch(value) {
      return String(value || "").trim().toLowerCase();
    },
  };
}

// Characters display for the characters page
function charactersDisplay() {
  return {
    query: "",
    openFactions: {},

    get factions() {
      const characters = Object.values(this.$store.auth.characters);
      const factionNames = PLACEHOLDER_FACTIONS.filter((factionName) =>
        characters.some((character) => character.faction === factionName)
      );

      return factionNames.map((factionName) => ({
        id: factionName.toLowerCase().replaceAll(" ", "-"),
        name: factionName,
        characters: characters.filter((character) => character.faction === factionName)
      }));
    },

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
