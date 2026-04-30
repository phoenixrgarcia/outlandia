# Outlandia Implementation Roadmap

Last updated: 2026-04-26

Source documents:

- `agent/outlandia-update-spec.md`
- `agent/outlandia-technical-plan.md`

## Purpose

This roadmap turns the existing Outlandia specification and technical plan into a step-by-step task list.

The goal is to transform the current static space western mystery companion site into a medieval fantasy royal court murder mystery companion app titled:

**Otherwordly Occurance in Outlandia**

This document is intentionally implementation-focused. It should help future work happen in the right order without inventing final mystery content, character secrets, lore, clue text, culprit, red herrings, or narrative voice.

## Guiding Constraints

- Preserve the creative boundaries from the spec.
- Use neutral TODO placeholders until human writers provide final content.
- Keep the app usable at the end of each phase.
- Start with the smallest complete version before adding backend complexity.
- Keep public and private character data separate.
- Design for approximately 40 playable characters.
- Keep admin characters as playable characters, not separate admin-only accounts.
- Prepare for Express, MongoDB, and Render deployment, but do not rush the migration before the static fantasy version is stable.

## Phase 0: Pre-Coding Decisions

Goal: confirm the few choices that affect labels, structure, and implementation direction.

### Tasks

- [ ] Confirm the exact title spelling: `Otherwordly Occurance in Outlandia`.
- [ ] Confirm whether the archive/database page should be called `Evidence Ledger`
- [ ] Confirm that Phase 1 should stay static before adding Express and MongoDB.
- [ ] Confirm placeholder factions:
  - `GMs`
  - `Royalty`
  - `Royal Court`
  - `The Guards`
  - `Alchemical Expressionist`
  - `Magicians`
  - `The Clergy`
  - `The Workers`
  - `The Streets`
- [ ] Decide whether any existing rule copy should be preserved exactly until a future writer pass.
- [ ] Decide whether placeholder character records should use generic numbered names or temporary role-style labels.

### Exit Criteria

- The project has confirmed placeholder names and labels.
- Phase 1 can begin without needing creative writing decisions.

## Phase 1: Static Fantasy Retheme And Data Foundation

Goal: convert the current static prototype into a medieval fantasy royal court companion site while preserving existing pages and behavior.

This is the recommended first implementation phase.

### 1. Audit Current Files

- [ ] Review `index.html`.
- [ ] Review `characters.html`.
- [ ] Review `rules.html`.
- [ ] Review `lore.html`.
- [ ] Review `database.html`.
- [ ] Review `css/style.css`.
- [ ] Review `js/app.js`.
- [ ] Identify all visible sci-fi, space western, terminal, neon, stardate, spaceship, saloon, and planetary language.
- [ ] Identify all places where private character data is currently stored or displayed.

### 2. Add Central Site Constants

- [ ] Add centralized constants in `js/app.js` or a new config file loaded before `js/app.js`.
- [ ] Include the site title.
- [ ] Include display title.
- [ ] Include nav labels.
- [ ] Include page labels.
- [ ] Include placeholder factions.
- [ ] Use neutral placeholder labels rather than final lore.

Suggested labels:

- `Court Entry`
- `Lore`
- `Rules`
- `Characters`
- `Court Archive`
- `Leave Character`

### 3. Replace Page Titles And Navigation Language

- [ ] Update `<title>` tags across all HTML files.
- [ ] Replace `INCIDENT OF STARDATE-2260`.
- [ ] Replace `Planet Sinker`.
- [ ] Replace `Shack-a-loon Database`.
- [ ] Replace `Terminate Session`.
- [ ] Replace other page chrome that reads as sci-fi, western, neon, terminal, or space themed.
- [ ] Keep final lore-specific names out of the UI unless the user confirms them.

### 4. Rebuild Home Character Selection

- [ ] Replace the plain character dropdown with a searchable selector.
- [ ] Allow search by character name.
- [ ] Allow search by player name.
- [ ] Allow search by class.
- [ ] Allow search by faction.
- [ ] Group search results by faction.
- [ ] Preserve character password login behavior for the static phase.
- [ ] Keep labels accessible.
- [ ] Keep keyboard and mouse interactions usable.
- [ ] Make the selector practical for around 40 characters.

### 5. Replace Character Data With Fantasy Placeholders

- [ ] Convert the character data model to support the fields from the spec.
- [ ] Create approximately 40 placeholder character records.
- [ ] Use only neutral placeholder content.
- [ ] Include at least one admin or GM placeholder.
- [ ] Include at least one placeholder with `canAdvanceRound`.
- [ ] Include at least one dead placeholder for UI testing.
- [ ] Avoid inventing final story, clues, backstories, or secrets.

Recommended fields:

```js
{
  id,
  name,
  player,
  class,
  faction,
  publicBlurb,
  password,
  inventory,
  secret,
  twist,
  goals,
  clues,
  privateInformation,
  relationships,
  money,
  isAdmin,
  canAdvanceRound,
  isDead,
  statuses
}
```

### 6. Update Authenticated Character View

- [ ] Replace old private sections with the new fantasy/private sections.
- [ ] Add `Inventory`.
- [ ] Add `Goals`.
- [ ] Add `Secret`.
- [ ] Add `Twist`.
- [ ] Add `Relationships`.
- [ ] Add `Character Clues`.
- [ ] Display money only in the logged-in private view.
- [ ] Display statuses in the private view.
- [ ] Show an admin dashboard link only for admin placeholders.
- [ ] Add a visible dead-state treatment when the logged-in character is dead.
- [ ] Preserve logout behavior.

### 7. Retheme `characters.html`

- [ ] Keep public character browsing behavior.
- [ ] Group characters by placeholder faction.
- [ ] Use dropdown or accordion sections for factions.
- [ ] Display public fields only.
- [ ] Show character name.
- [ ] Show player placeholder.
- [ ] Show class.
- [ ] Show faction.
- [ ] Show public blurb.
- [ ] Show alive/dead indicator.
- [ ] Do not expose inventory, goals, secret, twist, private info, private clues, or relationships.
- [ ] Add search or filtering if the 40-character grouped list feels unwieldy.

### 8. Retheme `rules.html`

- [ ] Preserve the existing rules page structure.
- [ ] Keep accordion behavior.
- [ ] Remove or replace western-only and sci-fi-only page chrome.
- [ ] Leave rule text mostly intact if it needs a future writer pass.
- [ ] Mark future fantasy language updates with TODO placeholders where needed.

### 9. Retheme `lore.html`

- [ ] Remove current space western lore content.
- [ ] Replace with neutral placeholder sections.
- [ ] Do not invent final worldbuilding.

Suggested placeholder sections:

- `Court Context`
- `Factions`
- `The Realm`
- `Known Customs`
- `Map Or Venue Notes`

### 10. Retheme `database.html`

- [ ] Rename or reframe the page as the chosen archive label.
- [ ] Use `Court Archive` as the temporary default unless another label is confirmed.
- [ ] Replace password portal content with placeholder global clue or archive records.
- [ ] Keep static client-side visibility behavior for Phase 1 only.
- [ ] Structure records as if they will later come from `/api/clues/global`.
- [ ] Make it clear in TODO comments that admin-revealed global clues become public.
- [ ] Keep shop-purchased clues conceptually separate from global clues.

### 11. Rewrite The Visual Theme

- [ ] Replace the neon/dark space western palette in `css/style.css`.
- [ ] Use a readable medieval fantasy royal court palette.
- [ ] Add or adjust theme tokens for parchment surfaces.
- [ ] Add or adjust theme tokens for ink text.
- [ ] Add or adjust theme tokens for royal burgundy.
- [ ] Add or adjust theme tokens for deep green.
- [ ] Add or adjust theme tokens for antique gold.
- [ ] Add or adjust theme tokens for candlelit shadow.
- [ ] Add or adjust theme tokens for muted stone.
- [ ] Keep contrast high.
- [ ] Avoid excessive ornamentation that makes dense information hard to scan.
- [ ] Keep card border radius at 8px or less unless Bootstrap defaults require otherwise.
- [ ] Remove or rename legacy classes only when all usages are updated.

### 12. Verify Phase 1

- [ ] Run the existing static development workflow.
- [ ] Check every page on desktop.
- [ ] Check every page on mobile.
- [ ] Confirm login works.
- [ ] Confirm logout works.
- [ ] Confirm search finds characters by name.
- [ ] Confirm search finds characters by player.
- [ ] Confirm search finds characters by class.
- [ ] Confirm search finds characters by faction.
- [ ] Confirm the public character list handles approximately 40 records.
- [ ] Confirm private fields only show after login.
- [ ] Confirm dead-state treatment appears for the dead placeholder.
- [ ] Confirm admin dashboard link only appears for admin placeholders.
- [ ] Search for remaining sci-fi, western, neon, terminal, stardate, spaceship, saloon, and planet language.

### Phase 1 Exit Criteria

- [ ] All existing pages still load.
- [ ] The visible theme reads as medieval fantasy royal court intrigue.
- [ ] The home character selector is searchable and scalable.
- [ ] Public and private character data are separated in the UI model.
- [ ] Authenticated private view contains Inventory, Goals, Secret, Twist, Relationships, and Character Clues.
- [ ] Placeholder factions are GMs, Royalty, Royal Court, The Guards, ALCHEMICAL EXPRESSIONIST, Magicians, The Clergy, The Workers, and The Streets.
- [ ] No final mystery content has been invented.
- [ ] The code remains ready for backend migration.

## Phase 2: Express And MongoDB Backend Foundation

Goal: move private data, passwords, and game state out of browser JavaScript and into server-side APIs backed by MongoDB.

### 1. Install Backend Dependencies

- [ ] Add `express`.
- [ ] Add `mongoose`.
- [ ] Add `bcryptjs` or `bcrypt`.
- [ ] Add `jsonwebtoken`.
- [ ] Add `dotenv`.
- [ ] Add `nodemon` for development.
- [ ] Add `cookie-parser` only if needed.
- [ ] Add `cors` only if frontend and backend origins differ.

### 2. Update Package Scripts

- [ ] Add `dev` script for local Express development.
- [ ] Add `seed` script for placeholder data.
- [ ] Add `start` script for Render production.
- [ ] Preserve or replace the current static workflow intentionally.

### 3. Create Server Structure

- [ ] Create `server/index.js`.
- [ ] Create `server/config/env.js`.
- [ ] Create `server/config/db.js`.
- [ ] Create `server/models/Character.js`.
- [ ] Create `server/models/Clue.js`.
- [ ] Create `server/models/GameState.js`.
- [ ] Create `server/routes/auth.js`.
- [ ] Create `server/routes/characters.js`.
- [ ] Create `server/middleware/auth.js`.
- [ ] Create `server/seed/seed.js`.

Later phases may add:

- `server/models/Item.js`
- `server/models/ShopEntry.js`
- `server/models/InboxMessage.js`
- `server/routes/admin.js`
- `server/routes/shop.js`
- `server/routes/clues.js`
- `server/routes/inbox.js`
- `server/services/effects.js`
- `server/services/rolls.js`
- `server/services/eventLog.js`

### 4. Add Environment Variables

- [ ] Add `MONGODB_URI`.
- [ ] Add `JWT_SECRET`.
- [ ] Add `PORT`.
- [ ] Add `NODE_ENV`.
- [ ] Add optional `TOKEN_TTL`.
- [ ] Document local `.env` setup.
- [ ] Do not commit secrets.

### 5. Serve Static Frontend Through Express

- [ ] Serve HTML, CSS, JavaScript, and images with `express.static`.
- [ ] Keep existing page URLs working.
- [ ] Decide later whether to support extensionless routes.

### 6. Define Core Mongo Models

- [ ] Define `Character` public identity fields.
- [ ] Define `Character` password hash.
- [ ] Define `Character` private fields.
- [ ] Define `Character` money.
- [ ] Define `Character` inventory.
- [ ] Define `Character` abilities placeholder.
- [ ] Define `Character` purchased clue IDs.
- [ ] Define `Character` statuses.
- [ ] Define `Character` modifiers.
- [ ] Define `Character` `isAdmin`.
- [ ] Define `Character` `canAdvanceRound`.
- [ ] Define `Character` `isDead`.
- [ ] Define `Clue` with `character`, `global`, and `shop` clue types.
- [ ] Define global clue reveal fields.
- [ ] Define private clue owner or purchaser references.
- [ ] Define singleton `GameState` with current round.

### 7. Seed Placeholder Data

- [ ] Convert Phase 1 placeholder characters into seed data.
- [ ] Hash placeholder passwords before saving.
- [ ] Seed at least one admin character.
- [ ] Seed at least one `canAdvanceRound` character.
- [ ] Seed at least one dead character.
- [ ] Seed placeholder global clues.
- [ ] Keep all seed content easy for writers to replace.

### 8. Implement Auth APIs

- [ ] Add `POST /api/auth/login`.
- [ ] Accept `characterId` and password.
- [ ] Verify password server-side.
- [ ] Return JWT token.
- [ ] Return only safe payload for the logged-in character.
- [ ] Add `GET /api/me`.
- [ ] Restore session from token.
- [ ] Store token in browser local storage per spec.
- [ ] Include character ID and permission flags in token.
- [ ] Fetch sensitive data server-side rather than trusting token payload.

### 9. Implement Character APIs

- [ ] Add `GET /api/characters/public`.
- [ ] Add `GET /api/characters/me`.
- [ ] Do not add arbitrary non-admin private character lookup.
- [ ] Ensure non-admin characters cannot fetch another character's private information.

### 10. Convert Frontend Auth To API Mode

- [ ] Replace local password comparison with `POST /api/auth/login`.
- [ ] Store token instead of full character data.
- [ ] Fetch `GET /api/me` on app initialization.
- [ ] Fetch public character data from the API.
- [ ] Handle invalid or expired tokens with logout.
- [ ] Show useful errors for failed login.

### 11. Verify Phase 2

- [ ] Seed MongoDB with placeholder fantasy records.
- [ ] Confirm private content is not present in page source.
- [ ] Confirm private content is not present in client JavaScript.
- [ ] Confirm one character cannot fetch another character's private data.
- [ ] Confirm invalid passwords fail.
- [ ] Confirm invalid tokens fail.
- [ ] Confirm admin-only permission flags are not enough without server checks.

### Phase 2 Exit Criteria

- [ ] The app runs through Express.
- [ ] MongoDB stores character and clue data.
- [ ] Password checks happen server-side.
- [ ] Private character information is no longer shipped to every browser.
- [ ] The frontend uses API data instead of static private data.

## Phase 3: Admin Dashboard And Live Game State

Goal: give GM/admin characters tools to manage game state during the event.

### 1. Add Admin Page

- [ ] Add `admin.html` or an equivalent admin route.
- [ ] Show the admin nav link only when the logged-in character has `isAdmin`.
- [ ] Preserve access back to the admin character's own private character sheet.
- [ ] Block non-admin access server-side.

### 2. Add Admin Character List

- [ ] Add `GET /api/admin/characters`.
- [ ] Show all characters.
- [ ] Add search by character name.
- [ ] Add search by player name.
- [ ] Show faction.
- [ ] Show class.
- [ ] Show alive/dead state.
- [ ] Show money.
- [ ] Show status summary.
- [ ] Show inventory summary.

### 3. Add Admin Mutation APIs

- [ ] Add `PATCH /api/admin/characters/:id/money`.
- [ ] Add `PATCH /api/admin/characters/:id/inventory`.
- [ ] Add `PATCH /api/admin/characters/:id/death`.
- [ ] Add `POST /api/admin/characters/:id/statuses`.
- [ ] Add `DELETE /api/admin/characters/:id/statuses/:statusId`.
- [ ] Add `POST /api/admin/modifiers/:modifierId/consume`.
- [ ] Add `PATCH /api/admin/clues/:id/reveal`.

### 4. Build Admin UI Controls

- [ ] Add money editor.
- [ ] Add inventory editor.
- [ ] Add dead/alive toggle.
- [ ] Add status add/remove controls.
- [ ] Add modifier consumption controls.
- [ ] Add global clue reveal controls.
- [ ] Use refetch-after-mutation for sensitive updates.
- [ ] Show clear unauthorized and validation errors.

### 5. Add Event Logging

- [ ] Decide between Mongo `EventLog` and structured JSON log file.
- [ ] Prefer Mongo if Render file persistence is uncertain.
- [ ] Log admin actions.
- [ ] Log clue reveals.
- [ ] Log death state changes.
- [ ] Log money changes.
- [ ] Log inventory changes.
- [ ] Log status changes.

### Phase 3 Exit Criteria

- [ ] Admin characters can manage live game state.
- [ ] Non-admin characters cannot access admin APIs.
- [ ] Admin characters still retain normal playable character access.
- [ ] Important admin actions are logged.

## Phase 4: Shop, Inbox, And Realtime

Goal: support private money spending, clue purchases, persistent player messages, and immediate notifications.

### 1. Add Shop Page And Models

- [ ] Create `ShopEntry` model.
- [ ] Create `Item` model if needed.
- [ ] Add `shop.html`.
- [ ] Add shop nav link.
- [ ] Add `GET /api/shop`.
- [ ] Add `POST /api/shop/purchase`.

### 2. Implement Purchase Rules

- [ ] Check logged-in character money server-side.
- [ ] Return clear insufficient-funds errors.
- [ ] Deduct money server-side.
- [ ] Increment consumable inventory items.
- [ ] Record private clue unlocks for clue purchases.
- [ ] Allow purchased clue text to be reopened by the buyer.
- [ ] Keep purchased clues private to the buyer.
- [ ] Do not mix purchased clues with global clue reveal state.

### 3. Add Inbox

- [ ] Create `InboxMessage` model.
- [ ] Add `GET /api/inbox`.
- [ ] Add `POST /api/inbox/mark-read`.
- [ ] Include title.
- [ ] Include body.
- [ ] Include message type.
- [ ] Include timestamp.
- [ ] Include old and new state when relevant.
- [ ] Mark messages read when inbox is opened.

### 4. Add Realtime Transport

- [ ] Add `socket.io` unless a different realtime library is selected.
- [ ] Authenticate socket connections with the same JWT.
- [ ] Join each connected player to a private room by character ID.
- [ ] Persist inbox messages before emitting events.
- [ ] Emit private inbox updates.
- [ ] Emit private status updates.
- [ ] Ensure offline players receive persisted messages later.

### 5. Add Notification UI

- [ ] Add unread indicator in nav or player header.
- [ ] Clear unread indicator after inbox open and mark-read succeeds.
- [ ] Handle realtime inbox events.
- [ ] Handle realtime status events.

### 6. Add Status Expiration

- [ ] Store `expiresAt` for timed statuses.
- [ ] Add scheduled expiration handling.
- [ ] Remove or mark expired statuses.
- [ ] Create inbox message when a status expires.
- [ ] Emit realtime update if the player is online.

### Phase 4 Exit Criteria

- [ ] Players can buy items or private clues.
- [ ] Purchased clues remain private.
- [ ] Inbox messages persist.
- [ ] Realtime updates work for online players.
- [ ] Offline players see missed messages later.

## Phase 5: Ability And Item Resolution System

Goal: create server-resolved gameplay actions for items, abilities, dice rolls, statuses, and effects.

### 1. Define Item And Ability Schemas

- [ ] Add names.
- [ ] Add descriptions.
- [ ] Add costs.
- [ ] Add quantities or use counts.
- [ ] Add allowed target rules.
- [ ] Add dead-target behavior.
- [ ] Add once-per-round flags.
- [ ] Add effect definitions.
- [ ] Add admin-resolution-required flag where needed.

### 2. Add Target Selection API

- [ ] Add `GET /api/actions/targets?actionId=...`.
- [ ] Support self-only targets.
- [ ] Support other-living-only targets.
- [ ] Support any-living targets.
- [ ] Support admin-resolution-required action types.
- [ ] Filter out dead targets where required.

### 3. Add Use Endpoints

- [ ] Add `POST /api/items/:itemId/use`.
- [ ] Add `POST /api/abilities/:abilityId/use`.
- [ ] Validate ownership.
- [ ] Validate quantity.
- [ ] Validate money cost.
- [ ] Validate status restrictions.
- [ ] Validate target rules.
- [ ] Validate round availability.

### 4. Add Roll Service

- [ ] Add `rollD20()`.
- [ ] Add `rollD6()`.
- [ ] Return raw roll.
- [ ] Return modifier.
- [ ] Return final roll.
- [ ] Return tier.
- [ ] Apply only one bonus or penalty at a time.

d20 tier table:

- `1-9`: fail
- `10-14`: partial
- `15-19`: success
- `20`: critical

### 5. Add Effect Executor

- [ ] Support money changes.
- [ ] Support item changes.
- [ ] Support status application.
- [ ] Support status expiration scheduling.
- [ ] Support global clue unlock.
- [ ] Support death.
- [ ] Support roll modifier application.
- [ ] Support inbox message creation.
- [ ] Return player-facing roll and effect results.
- [ ] Log every action.

### 6. Add Admin-Resolution Path

- [ ] Detect actions that cannot resolve automatically.
- [ ] Return a player-facing instruction to find a GM.
- [ ] Optionally create an admin inbox message.
- [ ] Log unresolved actions.

### Phase 5 Exit Criteria

- [ ] Items and abilities resolve through the server.
- [ ] Targeting rules are enforced server-side.
- [ ] Dead characters are excluded where required.
- [ ] Dice rolls and modifiers are consistently applied.
- [ ] Effects are logged and reflected in player state.

## Phase 6: Rounds

Goal: support server-tracked game rounds, mainly for ability availability.

### 1. Add Game Round State

- [ ] Store current round in `GameState`.
- [ ] Ensure a singleton game state record exists during seed/setup.

### 2. Add Round Advancement API

- [ ] Add `POST /api/admin/round/advance`.
- [ ] Require admin authentication.
- [ ] Require `canAdvanceRound`.
- [ ] Increment current round.
- [ ] Log round advancement.

### 3. Reset Round-Based Abilities

- [ ] Track once-per-round ability usage.
- [ ] Reset or update ability availability when the round advances.
- [ ] Prevent once-per-round abilities from being used twice in the same round.

### 4. Add Admin Round UI

- [ ] Show current round to authorized admins.
- [ ] Show advance-round control only to characters with `canAdvanceRound`.
- [ ] Add confirmation before advancing the round.
- [ ] Show success and failure states clearly.

### Phase 6 Exit Criteria

- [ ] Current round is stored server-side.
- [ ] Only authorized characters can advance the round.
- [ ] Once-per-round abilities respect round state.
- [ ] Round advancement is logged.

## Phase 7: Deployment, Tests, And Hardening

Goal: make the app ready for production use on Render.

### 1. Add Render Deployment Support

- [ ] Ensure `npm start` starts the Express server.
- [ ] Ensure static files are served by Express.
- [ ] Document Render build command.
- [ ] Document Render start command.
- [ ] Document required environment variables.
- [ ] Confirm MongoDB connection works in production.

### 2. Add Automated Tests For High-Risk Areas

- [ ] Test login success.
- [ ] Test login failure.
- [ ] Test token restore.
- [ ] Test private character scoping.
- [ ] Test admin permission gates.
- [ ] Test shop purchase success.
- [ ] Test insufficient money failure.
- [ ] Test global clue reveal.
- [ ] Test inbox persistence.
- [ ] Test mark-read behavior.
- [ ] Test roll tier calculations.
- [ ] Test modifier consumption.
- [ ] Test dead target filtering.
- [ ] Test once-per-round reset.

### 3. Add Manual QA Checklist

- [ ] Player login.
- [ ] Admin login.
- [ ] Character private page.
- [ ] Public character page.
- [ ] Admin inventory edit.
- [ ] Admin money edit.
- [ ] Admin death state edit.
- [ ] Status add/remove.
- [ ] Global clue reveal.
- [ ] Shop item purchase.
- [ ] Shop clue purchase.
- [ ] Purchased clue reopen.
- [ ] Realtime inbox message.
- [ ] Offline inbox persistence.
- [ ] Dead player display.
- [ ] Round advancement.
- [ ] Mobile layout.
- [ ] Desktop layout.

### 4. Security And Privacy Checks

- [ ] Confirm private content is not exposed in static files.
- [ ] Confirm passwords are hashed.
- [ ] Confirm JWT secret is required in production.
- [ ] Confirm admin routes reject non-admin users.
- [ ] Confirm `canAdvanceRound` is checked server-side.
- [ ] Confirm purchased clues are scoped to buyer.
- [ ] Confirm global clues are public only after reveal.
- [ ] Confirm dead target restrictions happen server-side.
- [ ] Confirm useful errors do not leak sensitive data.

### Phase 7 Exit Criteria

- [ ] The app is deployable to Render.
- [ ] Required environment variables are documented.
- [ ] High-risk behavior is covered by tests or manual QA.
- [ ] Security-sensitive routes are server-enforced.
- [ ] The app is ready for live event content entry and final writing pass.

## Recommended Immediate Next Step

Start with **Phase 1: Static Fantasy Retheme And Data Foundation**.

This creates a complete medieval fantasy placeholder version before the backend migration. It also gives writers and organizers something usable to review while the Express, MongoDB, admin, shop, inbox, ability, and round systems are built later.
