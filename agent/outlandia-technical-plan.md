# Outlandia Medieval Fantasy Technical Implementation Plan

Last updated: 2026-04-22

Source requirements: `agent/outlandia-update-spec.md`

## Planning Goal

Transform the current static space western prototype into a medieval fantasy royal court murder mystery companion app titled **Otherwordly Occurance in Outlandia**.

This document is for a future coding agent. It translates the requirements spec into implementation order, architecture decisions, and detailed steps. It should not invent final story content, final character secrets, final clue text, final worldbuilding, or the murder solution.

## Current Repository Assessment

The repo is currently a static Bootstrap/Alpine site with these core files:

- `index.html`: home page, character selection/login, authenticated character detail accordion.
- `characters.html`: public grouped character list.
- `rules.html`: rules page with accordions.
- `lore.html`: lore page with current space western content.
- `database.html`: evidence/database page using password-unlocked local portals.
- `css/style.css`: neon/dark space western theme.
- `js/app.js`: static character data, detailed character data, portal clue data, Alpine auth store, page components.
- `package.json`: only static/browser dependencies; `npm run dev` currently opens `index.html`.

Important current constraints:

- Auth is local-only and stores the full logged-in character in `localStorage`.
- Password checks happen in browser JavaScript.
- Private content is shipped to every browser because `CHARACTERS_DETAILED` is client-side.
- The database/evidence page uses local browser unlock state and hard-coded clues.
- The app has no Express server, MongoDB models, API layer, websocket transport, admin dashboard, shop, inbox, or rounds.

## Implementation Priority

Build in this order:

1. **Theme and static data foundation**
   Retheme the current static site, update placeholders, restructure client data to scale to around 40 characters, and keep the site usable while backend work is prepared.

2. **Express/Mongo backend foundation**
   Add the server, database connection, seed data, password auth, token middleware, protected private character APIs, and frontend API client.

3. **Admin dashboard and live game state**
   Add admin-only routes and UI for inventory, money, global clues, dead/alive state, statuses, and modifier consumption.

4. **Shop, inbox, and realtime**
   Add shop purchases, private purchased clues, persistent inbox messages, websocket notification delivery, and status expiration notifications.

5. **Ability/item resolution system**
   Add server-resolved actions, target rules, d20/d6 rolls, roll modifiers, status effects, item consumption, money costs, and admin-resolution-required paths.

6. **Rounds**
   Add round state, `canAdvanceRound`, round advancement route/UI, and once-per-round ability reset/update behavior.

7. **Deployment readiness and hardening**
   Add Render-ready scripts/config, production environment validation, security checks, smoke tests, and documentation.

The current implementation step should be **Phase 1: Theme and static data foundation**. This produces a stable medieval fantasy placeholder version before the larger backend migration.

## Phase 1: Theme And Static Data Foundation

### Objective

Convert the existing static prototype from space western/neon terminology into a medieval fantasy royal court dossier while preserving all existing pages and behavior.

### Technical Steps

1. Create centralized client constants for site identity.
   - Add constants in `js/app.js` or a small new `js/config.js` loaded before `js/app.js`.
   - Include `SITE_TITLE`, `DISPLAY_TITLE`, nav labels, page labels, and placeholder factions.
   - Use the exact provided title string: `Otherwordly Occurance in Outlandia`.
   - Keep copy neutral and placeholder-based.

2. Replace space western navigation and page framing.
   - Update `<title>` tags across all HTML files.
   - Replace `INCIDENT OF STARDATE-2260`, `Planet Sinker`, `Shack-a-loon Database`, `Terminate Session`, and similar language.
   - Suggested neutral labels:
     - Home: `Court Entry`
     - Lore: `Lore`
     - Rules: `Rules`
     - Characters: `Characters`
     - Database: `Court Archive`
     - Logout: `Leave Character`
   - Avoid final lore-specific names not in the spec.

3. Replace home login UI with a searchable character selector.
   - Replace the plain `<select>` with a search input plus grouped result list.
   - Support filtering by character name, player name, class, and faction.
   - Show faction grouping in results using GMs, Royalty, Royal Court, The Guards, Alchemical Expressionist, Magicians, The Clergy, The Workers, and The Streets.
   - Preserve password entry and login behavior for the static phase.
   - Keep keyboard/mouse accessible controls with labels and button states.

4. Convert static character data to the placeholder fantasy model.
   - Keep enough placeholder records to demonstrate scale, ideally 40 generated placeholder records with neutral names like `Placeholder Character 01`.
   - Use fields from the spec:
     - `id`
     - `name`
     - `player`
     - `class`
     - `faction`
     - `publicBlurb`
     - `password`
     - `inventory`
     - `secret`
     - `twist`
     - `goals`
     - `clues`
     - `privateInformation`
     - `relationships`
     - `money`
     - `isAdmin`
     - `canAdvanceRound`
     - `isDead`
     - `statuses`
   - Do not write final story content. Use clearly marked TODO placeholders.
   - Keep at least one admin/GM placeholder and one `canAdvanceRound` placeholder for UI testing.

5. Update authenticated character details.
   - Replace current sections `Occupation`, `Character`, `Goals`, `Abilities` with:
     - Inventory
     - Goals
     - Secret
     - Twist
     - Relationships
     - Character Clues
   - Display money only in the private logged-in view.
   - Show admin dashboard link only for admin placeholders, even if dashboard is not built yet.
   - Add dead-state header treatment when `isDead` is true.

6. Retheme `characters.html`.
   - Keep grouped accordion behavior.
   - Group by the confirmed placeholder factions.
   - Display public fields only: character name, player placeholder, class, faction, public blurb, dead/alive indicator.
   - Do not expose private fields.
   - Add search/filter if the grouped list feels unwieldy with 40 records.

7. Retheme `rules.html`.
   - Preserve accordion structure.
   - Replace western-only words only where they are page chrome or clearly outdated.
   - Leave game rule copy mostly intact if it needs a later writer pass.
   - Mark fantasy-specific edits as TODO where final language is needed.

8. Retheme `lore.html`.
   - Remove or replace current space western lore content with placeholder sections only.
   - Suggested section labels:
     - Court Context
     - Factions
     - The Realm
     - Known Customs
     - Map Or Venue Notes
   - Use TODO placeholder text, not generated worldbuilding.
   - Keep the page layout and responsive behavior.

9. Retheme `database.html` as a fantasy archive placeholder.
   - Use a neutral label such as `Court Archive` until the user confirms final framing.
   - Replace password portal content with placeholder global clue/archive records.
   - For the static phase, emulate visibility with client state, but structure records as if they will later be served from `/api/clues/global`.
   - Note in comments or TODO text that admin-revealed global clues become public while purchased shop clues stay private.

10. Rewrite `css/style.css` theme tokens.
    - Replace neon/cyber palette with a fantasy court palette.
    - Suggested tokens:
      - parchment surface
      - ink text
      - royal burgundy
      - deep green
      - antique gold
      - candlelit shadow
      - muted stone
    - Keep contrast high.
    - Avoid over-ornate flourishes that hurt scanning.
    - Keep card border radii at 8px or less unless existing Bootstrap cards demand otherwise.
    - Remove or rename classes only if all usages are updated. It is acceptable to keep legacy class names temporarily if changing them would create unnecessary churn.

11. Verify Phase 1.
    - Run the site locally using the existing static workflow.
    - Manually check each page at mobile and desktop widths.
    - Confirm:
      - login works
      - logout works
      - search finds characters by name/player/class/faction
      - grouped character list handles around 40 records
      - private sections only show after login
      - dead-state treatment appears for a dead placeholder
      - no obvious sci-fi, western, neon, terminal, stardate, spaceship, saloon, or planet language remains in page chrome

### Phase 1 Acceptance Criteria

- All existing pages still load.
- The visible theme reads as medieval fantasy royal court intrigue.
- The home character selector is searchable and practical for around 40 characters.
- Public and private character data are separated in the UI model.
- Authenticated private view contains Inventory, Goals, Secret, Twist, Relationships, and Character Clues sections.
- Placeholder factions are GMs, Royalty, Royal Court, The Guards, ALCHEMICAL EXPRESSIONIST, Magicians, The Clergy, The Workers, and The Streets.
- No final mystery content has been invented.
- The code remains ready for a backend migration.

## Phase 2: Express/Mongo Backend Foundation

### Objective

Move private data, passwords, and game state out of browser JavaScript into server-side APIs backed by MongoDB.

### Technical Steps

1. Install backend dependencies.
   - Add `express`, `mongoose`, `bcryptjs` or `bcrypt`, `jsonwebtoken`, `cookie-parser` if needed, `cors` only if frontend/backend origins differ, `dotenv`, and `nodemon` for development.
   - Add scripts:
     - `dev`: run Express locally
     - `seed`: seed placeholder data
     - `start`: production server for Render

2. Create server structure.
   - Suggested files:
     - `server/index.js`
     - `server/config/env.js`
     - `server/config/db.js`
     - `server/models/Character.js`
     - `server/models/Item.js`
     - `server/models/ShopEntry.js`
     - `server/models/Clue.js`
     - `server/models/InboxMessage.js`
     - `server/models/GameState.js`
     - `server/routes/auth.js`
     - `server/routes/characters.js`
     - `server/routes/admin.js`
     - `server/routes/shop.js`
     - `server/routes/clues.js`
     - `server/routes/inbox.js`
     - `server/middleware/auth.js`
     - `server/services/effects.js`
     - `server/services/rolls.js`
     - `server/services/eventLog.js`
     - `server/seed/seed.js`

3. Serve static frontend through Express.
   - Serve current HTML, CSS, JS, and images with `express.static`.
   - Keep existing page URLs working, or map extensionless routes later if desired.

4. Add environment variables.
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT`
   - `NODE_ENV`
   - Optional: `TOKEN_TTL`

5. Define core Mongo models.
   - Character:
     - public identity fields
     - password hash
     - private fields
     - money
     - inventory
     - abilities
     - purchased clue IDs
     - inbox metadata if useful
     - `isAdmin`
     - `canAdvanceRound`
     - `isDead`
     - statuses
     - modifiers
   - Clue:
     - `type`: `character`, `global`, `shop`
     - visibility/discovery fields
     - owner/purchaser references where private
   - GameState:
     - singleton document with current round and global settings.

6. Implement auth.
   - `POST /api/auth/login` with `characterId` and password.
   - Verify password server-side.
   - Return token plus safe public/private payload for that character only.
   - Store token in browser localStorage per spec.
   - Add `GET /api/me` to restore session from token.
   - Token payload should include character ID and permission flags, but all sensitive data must still be fetched server-side.

7. Implement API access rules.
   - `GET /api/characters/public`: all public character records.
   - `GET /api/characters/me`: private record for logged-in character.
   - Do not provide arbitrary `GET /api/characters/:id/private` to non-admins.
   - Admin APIs require `isAdmin`.
   - Round advancement requires `canAdvanceRound`.

8. Convert frontend auth store to API mode.
   - Replace local password comparison with `POST /api/auth/login`.
   - Store token, not full character details.
   - Fetch `GET /api/me` on init.
   - Fetch public character data from API for home and characters pages.
   - Handle expired/invalid token with logout.

9. Verify Phase 2.
   - Seed Mongo with placeholder fantasy records.
   - Confirm private content is not present in page source or client JS bundle.
   - Confirm one character cannot fetch another character's private information.
   - Confirm admin-only APIs reject non-admin tokens.

## Phase 3: Admin Dashboard And Live Game State

### Objective

Give GM/admin characters live controls for event state without losing access to their own playable character sheet.

### Technical Steps

1. Add `admin.html` or an admin section route.
   - Show nav link only if `isAdmin`.
   - If an admin is logged in, preserve access back to their own character sheet.

2. Add admin character list.
   - Fetch `GET /api/admin/characters`.
   - Support search by character name and player name.
   - Show faction, class, alive/dead, money, statuses, and inventory summary.

3. Add admin mutation APIs.
   - `PATCH /api/admin/characters/:id/money`
   - `PATCH /api/admin/characters/:id/inventory`
   - `PATCH /api/admin/characters/:id/death`
   - `POST /api/admin/characters/:id/statuses`
   - `DELETE /api/admin/characters/:id/statuses/:statusId`
   - `POST /api/admin/modifiers/:modifierId/consume`
   - `PATCH /api/admin/clues/:id/reveal`

4. Add optimistic UI only where failure is easy to recover.
   - Prefer refetch-after-mutation for money, inventory, death, and statuses.
   - Show clear errors when unauthorized or validation fails.

5. Add event logging service.
   - For first version, write structured JSON lines to a server-side log file if acceptable in the deployment environment.
   - Prefer a Mongo `EventLog` collection if file persistence on Render is uncertain.
   - Log admin actions and important game events.

## Phase 4: Shop, Inbox, And Realtime

### Objective

Support private money spending, clue purchases, persistent player messages, and immediate notifications for important effects.

### Technical Steps

1. Add shop page and nav link.
   - `shop.html` frontend.
   - `GET /api/shop` returns infinite-stock shop entries.
   - `POST /api/shop/purchase` handles item/clue purchase.

2. Implement purchase rules.
   - Server checks logged-in character money.
   - If insufficient funds, return a clear error for frontend alert.
   - Consumable item purchase increments inventory.
   - Clue purchase records private unlock for buyer.
   - Purchased clue text can be reopened from shop.

3. Add inbox data model and APIs.
   - `GET /api/inbox`
   - `POST /api/inbox/mark-read`
   - Inbox messages include old/new state, timestamps, title, body, and event type.
   - Opening inbox marks all messages read.

4. Add websocket transport.
   - Use `socket.io` unless a different realtime library is selected.
   - Authenticate socket connections with the same token.
   - Join each connected player to a private room keyed by character ID.
   - Emit inbox updates and status updates to that room.
   - Persist every message before emitting so offline players receive it later.

5. Add unread indicator.
   - Show an icon or badge in nav/player header when unread inbox messages exist.
   - Clear after inbox open and successful mark-read.

6. Implement status expiration.
   - Store `expiresAt` for timed statuses.
   - Add a server interval or scheduled check that expires statuses.
   - On expiration, create inbox message and emit realtime update if online.

## Phase 5: Ability And Item Resolution

### Objective

Create a reusable server-side effect system for inventory items and abilities.

### Technical Steps

1. Define item and ability schemas.
   - Include name, description, cost/quantity, allowed targets, dead-target behavior, use limits, once-per-round flags, and effect definitions.

2. Add target selection API support.
   - `GET /api/actions/targets?actionId=...`
   - Filter out dead targets where required.
   - Support self-only, other-living-only, any-living, and admin-resolution-required action types.

3. Add use endpoints.
   - `POST /api/items/:itemId/use`
   - `POST /api/abilities/:abilityId/use`
   - Validate ownership, quantity, money, status restrictions, target validity, and round availability.

4. Add roll service.
   - `rollD20()` returns raw roll, modifier, final roll, tier.
   - `rollD6()` returns raw roll and quality tier.
   - Tier table:
     - 1-9 fail
     - 10-14 partial
     - 15-19 success
     - 20 critical
   - Apply only one bonus or penalty at a time.

5. Add effect executor.
   - Initial effect types:
     - money changes
     - item changes
     - status application
     - status expiration scheduling
     - global clue unlock
     - death
     - roll modifier application
     - inbox message creation
   - Return player-facing roll/effect result.
   - Log every action.

6. Add admin-resolution-required path.
   - If an action cannot resolve automatically, create a player-facing response telling them to find a GM.
   - Optionally create an admin inbox/log entry.

## Phase 6: Rounds

### Objective

Support server-tracked game rounds primarily for ability availability, not as a prominent player-facing feature.

### Technical Steps

1. Store current round in `GameState`.
2. Add `POST /api/admin/round/advance`.
   - Require `canAdvanceRound`.
   - Increment round.
   - Reset or update once-per-round ability usage state.
   - Log round advancement.
3. Add minimal admin UI control.
   - Show only to authorized admin/GM character.
   - Confirm before advancing.
4. Add backend checks.
   - Once-per-round abilities can only be used if not already used this round.
   - On successful use, store last used round or usage record.

## Phase 7: Deployment, Tests, And Hardening

### Technical Steps

1. Add Render deployment support.
   - Ensure `npm start` starts the Express server.
   - Document required environment variables.
   - Confirm static files are served by Express.

2. Add tests where risk is highest.
   - Auth: login success/failure, token restore, private scoping.
   - Admin permission gates.
   - Shop purchase and insufficient money.
   - Global clue reveal.
   - Inbox persistence and mark-read.
   - Roll tier calculations and modifier consumption.
   - Dead target filtering.
   - Once-per-round reset.

3. Add manual QA checklist.
   - Player login.
   - Admin login.
   - Character private page.
   - Public characters page.
   - Admin inventory edit.
   - Shop item purchase.
   - Shop clue purchase/reopen.
   - Realtime inbox message.
   - Offline inbox persistence.
   - Dead player display.
   - Round advancement.

## Suggested Data Shape

Use this as a starting point, not a final schema contract:

```js
Character {
  id: String,
  name: String,
  player: String,
  class: String,
  faction: String,
  publicBlurb: String,
  passwordHash: String,
  money: Number,
  inventory: [{ itemId, name, quantity, description }],
  abilities: [{ abilityId, name, description, cost, usesRemaining, oncePerRound, lastUsedRound }],
  goals: [String],
  secret: String,
  twist: String,
  privateInformation: String,
  relationships: [{ characterId, label, notes }],
  characterClues: [{ clueId, title, text }],
  purchasedClueIds: [ObjectId],
  statuses: [{ id, type, label, description, appliedAt, expiresAt }],
  modifiers: [{ id, type, amount, scope, label, consumedAt, expiresAt }],
  isAdmin: Boolean,
  canAdvanceRound: Boolean,
  isDead: Boolean
}
```

```js
ShopEntry {
  id: String,
  type: "item" | "clue",
  name: String,
  description: String,
  price: Number,
  itemTemplateId: ObjectId,
  clueId: ObjectId,
  active: Boolean
}
```

```js
Clue {
  id: String,
  type: "character" | "global" | "shop",
  title: String,
  placeholderText: String,
  ownerCharacterId: ObjectId,
  revealedGlobally: Boolean,
  revealedAt: Date
}
```

```js
InboxMessage {
  characterId: ObjectId,
  title: String,
  body: String,
  type: String,
  read: Boolean,
  createdAt: Date,
  relatedEventId: ObjectId
}
```

```js
GameState {
  key: "main",
  currentRound: Number,
  updatedAt: Date
}
```

## API Sketch

Player APIs:

- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/auth/logout` optional client-side token discard helper
- `GET /api/characters/public`
- `GET /api/characters/me`
- `GET /api/clues/global`
- `GET /api/shop`
- `POST /api/shop/purchase`
- `GET /api/inbox`
- `POST /api/inbox/mark-read`
- `GET /api/actions/targets`
- `POST /api/items/:itemId/use`
- `POST /api/abilities/:abilityId/use`

Admin APIs:

- `GET /api/admin/characters`
- `PATCH /api/admin/characters/:id/money`
- `PATCH /api/admin/characters/:id/inventory`
- `PATCH /api/admin/characters/:id/death`
- `POST /api/admin/characters/:id/statuses`
- `DELETE /api/admin/characters/:id/statuses/:statusId`
- `POST /api/admin/modifiers/:modifierId/consume`
- `PATCH /api/admin/clues/:id/reveal`
- `POST /api/admin/round/advance`

Realtime events:

- `inbox:new`
- `inbox:read`
- `character:status-updated`
- `character:money-updated`
- `character:inventory-updated`
- `global-clue:revealed`
- `game:round-advanced`

## Implementation Notes For Future Agents

- Preserve the spec's creative boundaries. Use TODO placeholders instead of writing final story.
- Keep public and private data paths separate from the beginning of backend work.
- Do not rely on client-side hiding for private or admin-only content once the server exists.
- Admin characters are also playable characters; never make admin login a separate non-character identity unless the spec changes.
- Purchased shop clues are private to the buyer and must not be mixed with global clue reveal state.
- Revealed global clues are visible to everyone, including visitors without login.
- Dead characters remain visible publicly and can log out so another character can be selected.
- Dead characters cannot be ability targets.
- Prefer simple, explicit server-side services over complex rule engines until final content and abilities are known.
- Keep all placeholder seeds easy for writers to replace later.
