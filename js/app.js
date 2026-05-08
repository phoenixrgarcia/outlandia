const PLACEHOLDER_FACTIONS = [
  "GMs",
  "Royalty",
  "Royal Court",
  "The Guards",
  "Alchemical Expressionist",
  "Magicians",
  "The Clergy",
  "The Workers",
  "The Streets",
];

const AUTH_TOKEN_STORAGE_KEY = "outlandiaAuthToken";
const LEGACY_CHARACTER_STORAGE_KEY = "loggedInCharacter";
const SILVER_PER_GOLD = 5;
let socketClientLoadPromise = null;

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
  [
    "alchemist_01",
    "Placeholder Alchemist 01",
    "Alchemist",
    "Alchemical Expressionist",
  ],
  [
    "alchemist_02",
    "Placeholder Alchemist 02",
    "Apothecary",
    "Alchemical Expressionist",
  ],
  [
    "alchemist_03",
    "Placeholder Alchemist 03",
    "Transmuter",
    "Alchemical Expressionist",
  ],
  [
    "alchemist_04",
    "Placeholder Alchemist 04",
    "Researcher",
    "Alchemical Expressionist",
  ],
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
    image: "default.png",
  };
}

const CHARACTERS = Object.fromEntries(
  PLACEHOLDER_CHARACTER_SEEDS.map((seed, index) => {
    const character = createPlaceholderCharacter(seed, index);
    return [character.id, character];
  }),
);

function createCharacterDetails(
  player,
  character,
  occupationAndClothingTypeSuggestions,
  characterDetails,
  goals,
  abilities,
) {
  return {
    player,
    character,
    occupationAndClothingTypeSuggestions,
    characterDetails,
    goals,
    abilities,
  };
}

const CHARACTERS_DETAILED = {};

function normalizeCurrencyAmount(value) {
  return Math.max(0, Math.floor(Number(value || 0)));
}

function normalizeCurrency(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      gold: normalizeCurrencyAmount(value.gold),
      silver: normalizeCurrencyAmount(value.silver),
    };
  }

  const legacyTotalSilver = normalizeCurrencyAmount(value);

  return {
    gold: Math.floor(legacyTotalSilver / SILVER_PER_GOLD),
    silver: legacyTotalSilver % SILVER_PER_GOLD,
  };
}

function currency(gold = 0, silver = 0) {
  return {
    gold: normalizeCurrencyAmount(gold),
    silver: normalizeCurrencyAmount(silver),
  };
}

function currencyValueInSilver(value) {
  const normalized = normalizeCurrency(value);

  return normalized.gold * SILVER_PER_GOLD + normalized.silver;
}

function formatCurrency(value) {
  const normalized = normalizeCurrency(value);
  const parts = [];

  if (normalized.gold) {
    parts.push(`${normalized.gold} gold`);
  }

  if (normalized.silver || !parts.length) {
    parts.push(`${normalized.silver} silver`);
  }

  return parts.join(" ");
}

document.addEventListener("alpine:init", () => {
  installInboxShell();
  Alpine.store("auth", createAuthStore());
  Alpine.data("characterSelector", characterSelector);
  Alpine.data("charactersDisplay", charactersDisplay);
  Alpine.data("loggedInCharacterDetails", loggedInCharacterDetails);
  Alpine.data("adminDashboard", adminDashboard);
  Alpine.data("shopPage", shopPage);
});

function installInboxShell() {
  document.querySelectorAll(".navbar-nav").forEach((nav) => {
    if (nav.querySelector(".inbox-nav-item")) {
      return;
    }

    const inboxItem = document.createElement("li");
    inboxItem.className = "nav-item inbox-nav-item";
    inboxItem.setAttribute("x-show", "$store.auth.loggedIn");
    inboxItem.setAttribute("x-cloak", "");
    inboxItem.innerHTML = `
      <a class="nav-link inbox-nav-link" href="#" @click.prevent="$store.auth.openInbox()">
        <span>Inbox</span>
        <span
          class="inbox-unread-badge"
          x-show="$store.auth.unreadInboxCount > 0"
          x-text="$store.auth.unreadInboxCount"
          aria-label="Unread inbox messages"
          x-cloak
        ></span>
      </a>
    `;

    const leaveItem = Array.from(nav.children).find((item) =>
      (item.textContent || "").toLowerCase().includes("leave character"),
    );

    nav.insertBefore(inboxItem, leaveItem || null);
  });

  if (document.getElementById("playerInboxShell")) {
    return;
  }

  const inboxShell = document.createElement("div");
  inboxShell.id = "playerInboxShell";
  inboxShell.setAttribute("x-show", "$store.auth.showInbox");
  inboxShell.setAttribute("x-transition.opacity", "");
  inboxShell.setAttribute("x-cloak", "");
  inboxShell.className = "inbox-overlay";
  inboxShell.innerHTML = `
    <section
      class="inbox-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-inbox-title"
      @click.outside="$store.auth.closeInbox()"
    >
      <div class="inbox-panel-header">
        <div>
          <p class="dossier-kicker mb-1">Private Notices</p>
          <h2 id="player-inbox-title" class="section-title mb-0">Inbox</h2>
        </div>
        <button type="button" class="inbox-close" @click="$store.auth.closeInbox()" aria-label="Close inbox">x</button>
      </div>

      <p class="text-muted mb-3" x-show="$store.auth.isInboxLoading">Gathering sealed messages...</p>
      <p class="text-danger mb-3" x-show="$store.auth.inboxError" x-text="$store.auth.inboxError"></p>

      <div class="inbox-message-list" x-show="!$store.auth.isInboxLoading">
        <template x-if="!$store.auth.inboxMessages.length">
          <p class="text-muted mb-0">No private messages yet.</p>
        </template>
        <template x-for="message in $store.auth.inboxMessages" :key="message.id">
          <article class="inbox-message" :class="{ 'is-unread': !message.read }">
            <div class="inbox-message-head">
              <span class="inbox-message-type" x-text="$store.auth.formatInboxType(message.type)"></span>
              <time class="inbox-message-time" :datetime="message.timestamp" x-text="$store.auth.formatInboxTime(message.timestamp)"></time>
            </div>
            <h3 class="inbox-message-title" x-text="message.title"></h3>
            <p class="inbox-message-body" x-text="message.body"></p>
          </article>
        </template>
      </div>
    </section>
  `;
  document.body.appendChild(inboxShell);
}

function loadSocketClient() {
  if (window.io) {
    return Promise.resolve(window.io);
  }

  if (socketClientLoadPromise) {
    return socketClientLoadPromise;
  }

  socketClientLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/socket.io/socket.io.js";
    script.async = true;
    script.onload = () => resolve(window.io);
    script.onerror = () => reject(new Error("Realtime client is unavailable."));
    document.head.appendChild(script);
  });

  return socketClientLoadPromise;
}

function createAuthStore() {
  return {
    character: null,
    characters: {},
    characterDetails: CHARACTERS_DETAILED,
    authToken: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "",
    error: "",
    isLoadingCharacters: false,
    isRestoringSession: false,
    isLoggingIn: false,
    showLogoutConfirm: false,
    showInbox: false,
    inboxMessages: [],
    unreadInboxCount: 0,
    isInboxLoading: false,
    inboxError: "",
    socket: null,
    realtimeConnected: false,

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
          data.characters.map((character) => [character.id, character]),
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
        await this.afterAuthenticated();
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
          this.showLoginError(
            data.error || "Access denied. Incorrect password.",
          );
          return;
        }

        this.authToken = data.token;
        this.character = data.character;
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
        await this.afterAuthenticated();
        alert(`Login successful! Welcome, ${data.character.name}.`);
      } catch (error) {
        this.showLoginError(
          "Unable to reach the login service. Please try again.",
        );
      } finally {
        this.isLoggingIn = false;
      }
    },

    showLoginError(message) {
      this.error = message;
      alert(message);
    },

    async afterAuthenticated() {
      await this.loadInboxPreview();
      this.connectRealtime();
    },

    async loadInboxPreview() {
      if (!this.authToken) {
        return;
      }

      try {
        const response = await fetch("/api/inbox?markRead=false", {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load inbox messages.");
        }

        this.inboxMessages = data.messages || [];
        this.unreadInboxCount = Number(data.unreadCount || 0);
      } catch (error) {
        this.inboxError = error.message || "Unable to load inbox messages.";
      }
    },

    async openInbox() {
      if (!this.authToken) {
        return;
      }

      this.showInbox = true;
      this.isInboxLoading = true;
      this.inboxError = "";

      try {
        const response = await fetch("/api/inbox", {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to open inbox.");
        }

        this.inboxMessages = data.messages || [];
        this.unreadInboxCount = 0;
      } catch (error) {
        this.inboxError = error.message || "Unable to open inbox.";
      } finally {
        this.isInboxLoading = false;
      }
    },

    closeInbox() {
      this.showInbox = false;
    },

    async markInboxRead() {
      if (!this.authToken) {
        return;
      }

      try {
        const response = await fetch("/api/inbox/mark-read", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to mark inbox messages read.");
        }

        this.inboxMessages = this.inboxMessages.map((message) => ({
          ...message,
          read: true,
          readAt: message.readAt || new Date().toISOString(),
        }));
        this.unreadInboxCount = Number(data.unreadCount || 0);
      } catch (error) {
        this.inboxError =
          error.message || "Unable to mark inbox messages read.";
      }
    },

    connectRealtime() {
      if (!this.authToken || this.socket) {
        return;
      }

      loadSocketClient()
        .then((io) => {
          if (!this.authToken || this.socket) {
            return;
          }

          this.socket = io({
            auth: {
              token: this.authToken,
            },
          });

          this.socket.on("connect", () => {
            this.realtimeConnected = true;
          });

          this.socket.on("disconnect", () => {
            this.realtimeConnected = false;
          });

          this.socket.on("connect_error", () => {
            this.realtimeConnected = false;
          });

          this.socket.on("inbox:new", (payload) => {
            this.handleRealtimeInboxMessage(payload);
          });

          this.socket.on("inbox:read", (payload) => {
            this.handleRealtimeInboxRead(payload);
          });

          this.socket.on("status:update", (payload) => {
            this.handleRealtimeStatusUpdate(payload);
          });
        })
        .catch(() => {
          this.realtimeConnected = false;
        });
    },

    disconnectRealtime() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.realtimeConnected = false;
    },

    handleRealtimeInboxMessage(payload) {
      const message = payload?.message;

      if (!message?.id) {
        return;
      }

      const existingIndex = this.inboxMessages.findIndex(
        (item) => item.id === message.id,
      );

      if (existingIndex >= 0) {
        this.inboxMessages.splice(existingIndex, 1, message);
      } else {
        this.inboxMessages.unshift(message);
      }

      if (this.showInbox) {
        this.markInboxRead();
      } else if (!message.read) {
        this.unreadInboxCount += 1;
      }
    },

    handleRealtimeInboxRead(payload) {
      const readIds = new Set(
        (payload?.messageIds || []).map((messageId) => String(messageId)),
      );

      this.inboxMessages = this.inboxMessages.map((message) => {
        if (!readIds.size || readIds.has(message.id)) {
          return {
            ...message,
            read: true,
            readAt: message.readAt || new Date().toISOString(),
          };
        }

        return message;
      });
      this.unreadInboxCount = Number(payload?.unreadCount || 0);
    },

    handleRealtimeStatusUpdate(payload) {
      if (!this.character || payload?.characterId !== this.character.id) {
        return;
      }

      this.character = {
        ...this.character,
        statuses: payload.statuses || [],
      };
    },

    formatInboxType(type) {
      return String(type || "system").replace(/-/g, " ");
    },

    formatInboxTime(timestamp) {
      if (!timestamp) {
        return "";
      }

      return new Date(timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    },

    formatInboxState(message) {
      return JSON.stringify(
        {
          old: message.oldState || null,
          new: message.newState || null,
        },
        null,
        2,
      );
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
      this.disconnectRealtime();
      this.authToken = "";
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CHARACTER_STORAGE_KEY);
      this.character = null;
      this.inboxMessages = [];
      this.unreadInboxCount = 0;
      this.showInbox = false;
    },
  };
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
          character.faction,
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
        characters,
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
      return String(value || "")
        .trim()
        .toLowerCase();
    },

    getCharacterClass(character) {
      return (
        character.class ||
        character.className ||
        character.role ||
        character.publicBlurb ||
        character.blurb ||
        "Unassigned class"
      );
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

      const currentIndex = results.findIndex(
        (character) => character.id === this.activeCharacterId,
      );
      const nextIndex =
        currentIndex === -1
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

      const character = this.filteredCharacters.find(
        (item) => item.id === this.activeCharacterId,
      );

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
        this.selectedCharacterPassword,
      );
    },
  };
}

function loggedInCharacterDetails() {
  return {
    sections: {
      inventory: false,
      abilities: false,
      goals: false,
      secret: false,
      twist: false,
      relationships: false,
      clues: false,
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
      return formatCurrency(value);
    },

    formatText(text) {
      if (!text) {
        return "No information available.";
      }

      return this.escapeHtml(String(text)).replace(/\n/g, "<br>");
    },

    formatAbility(ability) {
      if (!ability) {
        return "None";
      }

      const name = ability.name ? `<strong>${this.escapeHtml(ability.name)}</strong>` : "";
      const description = ability.description
        ? this.escapeHtml(ability.description).replace(/\n/g, "<br>")
        : "";

      return [name, description].filter(Boolean).join(name && description ? "<br>" : "") || "None";
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
    },
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
      return this.escapeHtml(body || "No archive text available.").replace(
        /\n/g,
        "<br>",
      );
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
    isAdvancingRound: false,

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
          this.error =
            "Log in as an admin character to view the admin dashboard.";
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

    async advanceRound() {
      this.error = "";
      this.notice = "";

      if (!this.canAdvanceRound) {
        this.error = "This admin character cannot advance rounds.";
        return;
      }

      const currentRound = this.summary?.gameState?.currentRound || 1;
      const confirmed = window.confirm(
        `Advance from round ${currentRound} to round ${currentRound + 1}?`,
      );

      if (!confirmed) {
        return;
      }

      this.isAdvancingRound = true;

      try {
        const data = await this.adminRequest("/api/admin/round/advance", {
          method: "POST",
          body: JSON.stringify({}),
        });

        this.summary = {
          ...this.summary,
          gameState: data.gameState,
        };
        await this.refetchAdminState();
        this.notice = `Round advanced to ${data.gameState.currentRound}.`;
      } catch (error) {
        this.error = error.message || "Unable to advance the round.";
      } finally {
        this.isAdvancingRound = false;
      }
    },

    updateMoney(characterId, gold, silver) {
      return this.mutate(() =>
        this.adminRequest(`/api/admin/characters/${characterId}/money`, {
          method: "PATCH",
          body: JSON.stringify({ money: currency(gold, silver) }),
        }),
      );
    },

    updateInventory(characterId, inventoryText) {
      const inventory = String(inventoryText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [namePart, quantityPart] = line
            .split("|")
            .map((part) => part.trim());
          return {
            name: namePart,
            quantity: quantityPart ? Number(quantityPart) : 1,
          };
        });

      return this.mutate(() =>
        this.adminRequest(`/api/admin/characters/${characterId}/inventory`, {
          method: "PATCH",
          body: JSON.stringify({ inventory }),
        }),
      );
    },

    toggleDeath(character) {
      return this.mutate(() =>
        this.adminRequest(`/api/admin/characters/${character.id}/death`, {
          method: "PATCH",
          body: JSON.stringify({ isDead: !character.isDead }),
        }),
      );
    },

    addStatus(characterId, statusName, statusNote, expiresAt) {
      return this.mutate(() =>
        this.adminRequest(`/api/admin/characters/${characterId}/statuses`, {
          method: "POST",
          body: JSON.stringify({
            name: statusName,
            note: statusNote,
            expiresAt: expiresAt
              ? new Date(expiresAt).toISOString()
              : undefined,
          }),
        }),
      );
    },

    formatDateTime(value) {
      if (!value) {
        return "";
      }

      return new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    },

    removeStatus(characterId, statusId) {
      return this.mutate(() =>
        this.adminRequest(
          `/api/admin/characters/${characterId}/statuses/${statusId}`,
          {
            method: "DELETE",
          },
        ),
      );
    },

    consumeModifier(characterId, modifierId) {
      return this.mutate(() =>
        this.adminRequest(`/api/admin/modifiers/${modifierId}/consume`, {
          method: "POST",
          body: JSON.stringify({ characterId }),
        }),
      );
    },

    revealClue(clue) {
      return this.mutate(() =>
        this.adminRequest(`/api/admin/clues/${clue.id}/reveal`, {
          method: "PATCH",
          body: JSON.stringify({
            isRevealedGlobally: !clue.isRevealedGlobally,
          }),
        }),
      );
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

    get canAdvanceRound() {
      return Boolean(
        this.summary?.adminCharacter?.canAdvanceRound ||
        this.$store.auth.character?.canAdvanceRound,
      );
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
      const globalClues = this.summary?.clueCounts?.find(
        (item) => item.type === "global",
      );
      return globalClues?.count || 0;
    },

    get globalClues() {
      return this.clues.filter((clue) => clue.clueType === "global");
    },

    inventoryText(character) {
      return (character.inventory || [])
        .map(
          (item) =>
            `${item.name}${item.quantity && item.quantity !== 1 ? ` | ${item.quantity}` : ""}`,
        )
        .join("\n");
    },

    normalizeSearch(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    },
  };
}

function shopPage() {
  return {
    entries: [],
    isLoading: true,
    isPurchasing: false,
    error: "",
    notice: "",
    purchasedClues: {},
    poisonTargets: [],
    selectedTargets: {},

    async init() {
      this.$watch("$store.auth.character?.id", () => {
        this.loadPurchasedClues();
        this.loadPoisonTargets();
      });
      await this.loadShopEntries();
      await this.loadPurchasedClues();
      await this.loadPoisonTargets();
    },

    async loadShopEntries() {
      this.isLoading = true;
      this.error = "";

      try {
        const response = await fetch("/api/shop");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load the shop.");
        }

        this.entries = data.entries || [];
      } catch (error) {
        this.error = error.message || "Unable to load the shop.";
      } finally {
        this.isLoading = false;
      }
    },

    async loadPurchasedClues() {
      if (!this.loggedIn) {
        this.purchasedClues = {};
        return;
      }

      try {
        const response = await fetch("/api/shop/purchased-clues", {
          headers: {
            Authorization: `Bearer ${this.$store.auth.authToken}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load purchased clues.");
        }

        this.purchasedClues = Object.fromEntries(
          (data.clues || []).map((clue) => [clue.id, clue]),
        );
      } catch (error) {
        this.error = error.message || "Unable to load purchased clues.";
      }
    },

    async loadPoisonTargets() {
      if (!this.loggedIn) {
        this.poisonTargets = [];
        this.selectedTargets = {};
        return;
      }

      try {
        const response = await fetch("/api/shop/targets?effect=poison", {
          headers: {
            Authorization: `Bearer ${this.$store.auth.authToken}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load poison targets.");
        }

        this.poisonTargets = data.targets || [];
      } catch (error) {
        this.error = error.message || "Unable to load poison targets.";
      }
    },

    get itemEntries() {
      return this.entries.filter((entry) => entry.type === "item");
    },

    get clueEntries() {
      return this.entries.filter((entry) => entry.type === "clue");
    },

    get loggedInCharacter() {
      return this.$store.auth.character;
    },

    get loggedIn() {
      return this.$store.auth.loggedIn;
    },

    get currentMoney() {
      return normalizeCurrency(this.loggedInCharacter?.money);
    },

    formatPrice(value) {
      return formatCurrency(value);
    },

    isPoisonEntry(entry) {
      return entry?.itemTemplate?.itemId === "sample-poison";
    },

    targetLabel(target) {
      return `${target.name} - ${target.player} - ${target.faction}`;
    },

    async purchase(entry) {
      this.error = "";
      this.notice = "";

      if (!this.loggedIn) {
        window.location.href = "index.html";
        return;
      }

      if (this.isPoisonEntry(entry) && !this.selectedTargets[entry.id]) {
        alert("Choose who will receive the poison.");
        return;
      }

      this.isPurchasing = true;

      try {
        const payload = { shopId: entry.id };

        if (this.isPoisonEntry(entry)) {
          payload.targetCharacterId = this.selectedTargets[entry.id];
        }

        const response = await fetch("/api/shop/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.$store.auth.authToken}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Purchase failed.");
        }

        this.$store.auth.character = data.character;
        this.notice = data.message || "Purchase complete.";
        this.selectedTargets[entry.id] = "";

        if (data.clue) {
          this.purchasedClues = {
            ...this.purchasedClues,
            [data.clue.id]: data.clue,
          };
          this.scrollToShopEntry(entry);
        }
      } catch (error) {
        const message = error.message || "Purchase failed.";
        alert(message);
      } finally {
        this.isPurchasing = false;
      }
    },

    canAfford(entry) {
      return (
        currencyValueInSilver(this.currentMoney) >=
        currencyValueInSilver(entry.price)
      );
    },

    hasPurchasedClue(entry) {
      if (entry.type !== "clue") {
        return false;
      }

      return !!this.getPurchasedClue(entry);
    },

    getPurchasedClue(entry) {
      return this.purchasedClues[entry.clueId] || null;
    },

    purchaseLabel(entry) {
      if (!this.loggedIn) {
        return "Log in to buy";
      }

      if (this.hasPurchasedClue(entry)) {
        return "Purchased";
      }

      return `Purchase for ${this.formatPrice(entry.price)}`;
    },

    formatClueBody(body) {
      return this.escapeHtml(body || "No clue text available.").replace(
        /\n/g,
        "<br>",
      );
    },

    scrollToShopEntry(entry) {
      this.$nextTick(() => {
        document
          .getElementById(`shop-entry-${entry.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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

// Characters display for the characters page
function charactersDisplay() {
  return {
    query: "",
    openFactions: {},

    get factions() {
      const characters = Object.values(this.$store.auth.characters);
      const factionNames = PLACEHOLDER_FACTIONS.filter((factionName) =>
        characters.some((character) => character.faction === factionName),
      );

      return factionNames.map((factionName) => ({
        id: factionName.toLowerCase().replaceAll(" ", "-"),
        name: factionName,
        characters: characters.filter(
          (character) => character.faction === factionName,
        ),
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
              character.publicBlurb,
            ]
              .filter(Boolean)
              .some((value) => this.normalizeSearch(value).includes(search));
          }),
        }))
        .filter((faction) => faction.characters.length);
    },

    normalizeSearch(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
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
    },
  };
}
