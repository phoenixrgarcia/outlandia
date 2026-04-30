# Outlandia Medieval Fantasy Update Specification

Last updated: 2026-04-22

## Purpose

Use the current repository as the template for a second murder mystery companion site.
The first iteration is a space western mystery. The next iteration should become a medieval fantasy royal court mystery titled:

**Otherwordly Occurance in Outlandia**

This document captures implementation intent for AI agents. It should guide code and content-structure changes without asking agents to invent final mystery content, lore, character secrets, or narrative voice.

## Creative Boundaries

Human actors and writers will provide the creative mystery content later. Agents should not generate final:

- Mystery plot
- Victim, culprit, solution, or red herrings
- Character backstories beyond placeholders
- Clue text beyond placeholders
- Worldbuilding or lore beyond placeholders
- Final thematic copy

When text is required during implementation, agents should use:

- Existing repo copy where useful
- Neutral placeholders
- Clearly marked TODO content
- Repeated sample/filler data only when needed to prove UI behavior

## High-Level Direction

Retheme the existing site from dark space western to medieval fantasy with a Dungeons & Dragons inspired royal court intrigue visual style.

The setting is a royal court with a variety of character classes. The site should feel like a fantasy court dossier, intrigue archive, or game companion rather than a sci-fi terminal.

## Existing Features To Preserve

The new site should retain the current project's core feature set:

- HTML/CSS/JavaScript frontend structure, adapted as needed for server-side functionality
- Bootstrap and Alpine.js will be used for the front end. The backend will use express and mongo to have a server and a database
- Character login/selection on the home page
- Character-specific authenticated details
- Rules page
- Lore page
- Character listing page
- Database/evidence-style page
- Mobile responsive behavior

## Theme Intent

Replace the space western/cosmic/neon styling with medieval fantasy royal court styling.

Desired visual direction:

- Royal court intrigue
- Dungeons & Dragons inspired fantasy
- Manuscript, parchment, seal, crest, candlelit hall, court archive, spellbook, or royal ledger influences
- Rich but usable UI
- Dramatic without becoming cluttered
- Works well for 40-character navigation

Avoid:

- Space, sci-fi, western, neon, cyberpunk, terminal, stardate, spaceship, saloon, or planetary language
- Inventing fixed lore names beyond the provided title and placeholder labels
- Overly ornate styling that makes dense character information hard to scan

## Scale Change

The new game should support approximately 40 playable characters.

Each character will eventually have:

- Unique class
- Unique clues
- Unique private information
- Public display information
- Login credentials or access control equivalent

The implementation should be data-driven enough that adding or editing 40 characters is manageable.

Character login/selection must be searchable. A plain non-searchable dropdown is not sufficient for the larger roster.

Characters should be grouped by placeholder factions.

Confirmed placeholder factions:

- GMs
- Royalty
- Royal Court
- The Guards
- Alchemical Expressionist
- Magicians
- The Clergy
- The Workers
- The Streets

## Placeholder Content Model

Until final content exists, use placeholder fields that make the intended data clear.

Recommended character fields:

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

Final field names may adapt to the existing JavaScript structure, but the model should support these concepts.

## Known Open Area: Extended Functionality

Agents should preserve room for new features and avoid hard-coding assumptions that only work for the current six-character site.

The project is expected to move toward server-side functionality. Character data is intended to move to a MongoDB-backed data model in a future implementation phase. This needs more specification before implementation.

Confirmed server-side direction:

- Backend: Node.js with Express
- Database: MongoDB
- Local development first
- Production deployment target: Render
- Character login remains simple character password access, backed by tokens stored in browser local storage
- Private content must be strictly scoped to the logged-in character
- Admin characters should exist and receive access to an admin dashboard
- Admin characters are also playable story characters and need access to both admin controls and their own private character information

Potential implementation consideration:

- Keep character data centralized
- Keep repeated page navigation centralized or easy to update
- Prefer reusable UI components/patterns for character cards and private sections
- Make database/evidence structures extensible
- Avoid coupling UI code too tightly to static in-page character arrays, since MongoDB/server-side data will be introduced later

## Runtime Admin Functionality

The site should support admin characters who can manage game state during the event.

Confirmed admin dashboard capabilities:

- Modify character inventories
- Modify character money balances
- Mark global clues as discovered/revealed
- Mark players dead
- Apply statuses to characters
- Consume tracked bonuses or penalties when used in person

Other private character information is expected to remain stable during the game and should not need routine live editing.

More admin functionality may be added later. Agents should design the dashboard and backend routes with room for future capabilities.

Some characters are GM characters. GM characters are still playable story characters with normal character sheets, abilities, inventory, and private information. They also have access to the admin dashboard.

One admin/GM character should have authority to advance the game round. The specific character will be determined later, so this should be modeled as a permission flag such as `canAdvanceRound`.

## Page-Level Intent

### Home

Retain the login/character selection entry point.

Update language and styling from space credentials/session terminology to fantasy court access terminology, using placeholders where exact copy is not known.

The page should scale to around 40 characters without becoming unwieldy. Character selection must be searchable and should account for faction grouping.

### Characters

Retain the public character browsing page.

The character list must support around 40 characters grouped by placeholder faction.

Use the confirmed placeholder factions GMs, Royalty, Royal Court, The Guards, ALCHEMICAL EXPRESSIONIST, Magicians, The Clergy, The Workers, and The Streets unless later requirements replace them.

The public character list should remain similar to the existing characters page and use dropdown/accordion-style grouped sections.

### Rules

Retain the existing game rules behavior and structure.

Theme the presentation for fantasy court intrigue while leaving final rule copy to a future content pass unless current copy can be reused.

### Lore

Retain a lore/world information page.

Use placeholder content and sections. Do not generate final worldbuilding.

### Database

Retain the evidence/database-style page, but reinterpret it for a fantasy setting.

Possible placeholder framing:

- Royal archive
- Court records
- Evidence ledger
- Arcane index
- Dossier registry

Do not finalize the framing until the user confirms it.

Current clue visibility requirement:

- Clues are character-specific and visible to the logged-in character.
- Global clues only become visible when an admin marks the clue as discovered/revealed for everyone.
- Admins can reveal global clues on a clues page, conceptually similar to the current database page.
- Revealed global clues should be visible to everyone, with or without login.
- Shop-purchased clues are private to the buyer and should not become global clues.
- A broader shared evidence/archive area may be added in the future, but is not fully specified yet.

## Authenticated Character Detail Sections

Replace or adapt the current private character sections so the authenticated character view supports these sections:

- Inventory
- Goals
- Secret
- Twist
- Relationships

Character-specific clues should also be supported by the data model and displayed to the logged-in character when the relevant UI is defined.

## Auth And Access Control Intent

Character authentication should remain intentionally simple for the party-game use case.

Requirements:

- Characters authenticate with character-specific passwords.
- Successful login should issue/use tokens.
- Tokens should be stored in browser local storage.
- Tokens should authorize access to that character's private content.
- A character must not be able to access another character's private content.
- Admin characters have additional dashboard permissions.
- Admin capabilities must not be available to non-admin characters.
- Dead/alive state should be tracked so admins can mark players dead.
- Dead status should be visible on the public player/character list.
- When a logged-in character is dead, show skull-and-crossbones dead-state treatment in the page header and provide an option to log out so the user can log in as another character.
- Dead characters cannot be targeted by abilities.

The exact token format is not finalized in this spec. It should be selected during backend implementation with the Render/Express/Mongo architecture in mind.

## Inventory And Abilities Intent

Inventory is a live game-state area controlled by admins.

Money is private character state.

Money requirements:

- A player should see their current money balance on their private character page.
- Money should not be visible to other players.
- Admins should be able to edit character money balances.
- Money may increase or decrease when abilities are used.
- Money may increase or decrease when purchasing items from the shop.

Inventory items displayed on the frontend should include:

- Item name
- Number owned
- Description of what the item does
- Button to use the item

Using an item should open a modal that lets the player select which player/character to use the item on.

Character abilities should behave similarly to inventory items, except abilities cost money instead of consuming an owned quantity.

Ability and item resolution:

- Item use should generally resolve itself through server-side logic.
- Ability use should generally resolve itself through server-side logic.
- Some automatic server-side actions should roll a d20 to determine success or failure.
- Some automatic server-side actions should roll a d6 to determine quality or effect strength.
- Server-side resolution may apply the effect of the item or ability automatically.
- Some items or abilities may require admin resolution and should tell the player to find a GM.
- Dead players cannot be selected as ability targets.
- Ability/item targeting rules may vary by action.
- Some abilities can only target the acting character.
- Some abilities can only target other living characters.
- Some abilities apply bonuses or penalties to characters.
- Bonuses and penalties should be tracked server-side.
- A tracked bonus or penalty should apply to the next relevant server-side roll or the next relevant in-person roll.
- If a bonus or penalty is used in person, a GM should be able to consume the effect from the dashboard.
- Players should see roll results.
- Only one bonus or penalty can apply at a time.
- When a modifier is consumed in person, the GM should choose which modifier to consume.
- Roll modifiers should alter the d20 roll number, which can move the result into a higher or lower outcome tier.
- Critical success/failure behavior and per-tier effects will be specified later.

Roll result table:

| Roll      | Meaning  |
| --------- | -------- |
| d20 1-9   | Fail     |
| d20 10-14 | Partial  |
| d20 15-19 | Success  |
| d20 20    | Critical |

Quality/effect table:

| Roll   | Meaning             |
| ------ | ------------------- |
| d6 1-2 | Weak / Vague        |
| d6 3-4 | Normal              |
| d6 5-6 | Strong / Bonus info |

Admins should facilitate inventory management. Player-initiated inventory transfers are not currently confirmed.

Admin inventory management should live in one admin dashboard with a list of all characters. Admins should manage character inventories from that dashboard.

The admin dashboard character list should support search by character name and player name.

The data model should leave room for:

- Item ownership
- Item quantity
- Item description/effect text
- Use action target
- Character abilities
- Ability money cost
- Character money balance
- Server-side item/ability resolution behavior
- Admin-resolution-required item/ability behavior
- Server-side d20 roll behavior
- Server-side d6 quality/effect behavior
- Character statuses
- Status durations
- Buffs/bonuses
- Debuffs/penalties
- Whether a tracked modifier applies to server rolls, in-person rolls, or both

## Shop Intent

Add a shop where players can spend private character money.

The shop should be a new top-nav page.

Shop capabilities:

- Every character sees the same shop inventory.
- Shop stock is infinite.
- Players can buy consumable items.
- Purchased consumable items should be added to the buyer's inventory automatically.
- Players can buy clues.
- Purchased clues should unlock and display clue text in a modal.
- Purchased clues are private to the buyer.
- Purchased clues are distinct from admin-revealed global clues.
- Purchased clue state must persist server-side.
- Purchased clues should remain re-accessible after purchase.
- A purchased clue can be re-opened by clicking its button in the shop.
- Shop purchases should update character money server-side.
- Shop purchases should be backed by MongoDB through the Express backend.
- Failed purchases should alert the player that they do not have enough money.

Shop content should use placeholder items and placeholder clue text until final content is provided.

## Supported Effect Types

The initial server-side effect system should support:

- Money changes
- Item changes
- Status application
- Status duration, including durations as short as 1 minute
- Automatic server-side status expiration
- Global clue unlocks
- Death
- Roll modifiers

## Rounds Intent

The game should support rounds.

One admin/GM character should be able to advance the game to the next round. This should be permission-gated with a flag such as `canAdvanceRound`.

Round advancement matters because some abilities are limited by round.

Example requirement:

- Some abilities are once-per-round.
- Advancing the round should reset or update once-per-round ability availability.
- Poisoning another player is an example of a once-per-round ability.

The exact round display and timing model still need clarification.

The current round does not need to be displayed publicly or treated as a prominent player-facing feature. Round handling can happen mostly in person, with server state used for ability availability.

## Realtime Notification Intent

Some abilities require realtime notification to the target character.

Use web sockets or an equivalent realtime channel when needed.

Example:

- A character uses a poisoning ability on a target.
- Server resolves the action.
- The target receives an inbox message that they are poisoned.

Realtime functionality should be scoped to game events that require immediate player awareness.

Realtime notification UI should be built around a persistent player inbox rather than temporary-only popups.

## Inbox Intent

Add a player inbox/message queue.

Inbox requirements:

- Each character has their own inbox.
- Inbox messages are private to the character.
- The inbox contains old and new messages.
- New/unread messages should be indicated with an icon or badge on the message section.
- Opening the inbox is enough to mark all messages as read and clear the new-message indicator.
- Status-related events should create inbox messages.
- Messages should include when a character is affected by a status.
- Messages should also include when a status or effect has ended and the character is fine.
- If a target is not online when a notification happens, the message should still be available when they next log in.

Statuses should clear automatically on the server and on the player UI.

## Event Logging Intent

An event log would be useful but is not high priority.

If implemented, the event log can be simple. Writing events to a server-side file is acceptable for a first version.

Possible events to log:

- Item use
- Ability use
- Clue reveal
- Inventory edit
- Money edit
- Death status change
- Admin action
- Shop purchase
- Round advancement
- Status application
- Status expiration
- Bonus or penalty application
- Bonus or penalty consumption
- Realtime notification event
- Inbox message creation

## Assets Intent

Images, class icons, faction crests, and other fantasy assets are optional for now.

The implementation should leave room to add assets later without requiring them for the placeholder version.

## Implementation Priority

Prioritize implementation in this order:

1. Change the existing site style to the new medieval fantasy royal court style.
2. Add shop, inbox, and websocket/realtime functionality.
3. Add rounds functionality.

## Accessibility And Usability Intent

The larger character count makes usability important.

Agents should ensure:

- Character selection remains searchable, filterable, grouped, or otherwise practical for around 40 options
- Mobile layouts remain readable
- Interactive sections have accessible controls and labels
- Text contrast remains sufficient
- Long private character details can be scanned

## Non-Goals For This Spec

Do not implement final story content.
Do not generate final character rosters.
Do not decide the mystery solution.
Do not replace the confirmed Node/Express/Mongo/Render direction unless specifically requested.
Do not remove existing functionality unless superseded by later requirements.

## Interview Notes

Initial confirmed requirements:

- Title: **Otherwordly Occurance in Outlandia**
- Setting: medieval fantasy royal court
- Theme: Dungeons & Dragons inspired royal court intrigue
- Character count: around 40
- Character selection must be searchable
- Placeholder factions: GMs, Royalty, Royal Court, The Guards, ALCHEMICAL EXPRESSIONIST, Magicians, The Clergy, The Workers, The Streets
- Authenticated sections: Inventory, Goals, Secret, Twist, Relationships
- Clues are logged-in character specific
- Shared evidence/archive may be added later
- Backend: Node.js and Express
- Database: MongoDB
- Deployment target: Render
- Character auth remains simple password access with tokens
- Tokens stored in browser local storage
- Private content strictly scoped to logged-in character
- Admin characters are also playable characters
- Admin characters need both dashboard access and private character info access
- Admin runtime controls: modify inventory, reveal global clues, mark players dead
- Admins can edit private character money balances
- Admins/GMs can apply statuses and consume in-person bonuses/penalties
- Money is private to each character and changes through abilities or shop purchases
- Inventory frontend: name, number owned, description, use button, target-selection modal
- Character abilities behave like inventory actions but cost money
- Item/ability effects usually resolve server-side; some can require admin resolution
- Some server actions roll a d20 and apply success/failure logic
- Some server actions roll a d6 for quality/effect strength
- Players see roll results
- Initial supported effects: money changes, item changes, status application, status duration, global clue unlocks, death, roll modifier
- Statuses automatically expire on server and player UI
- Shop allows players to buy consumable items and clue unlocks
- Shop is a new top-nav page
- All characters see the same shop inventory
- Shop stock is infinite
- Purchased items are automatically added to inventory
- Purchased clues display unlocked clue text in a modal and remain private to the buyer
- Purchased clues persist and can be re-opened from the shop
- Failed purchases alert "not enough money"
- Some abilities require websocket/realtime notifications to targets
- Realtime notifications should persist in a private character inbox
- Inbox has old/new messages and an unread indicator icon/badge
- Opening inbox marks all messages as read
- GM characters are playable characters with admin dashboard access
- One admin/GM character can advance rounds via a permission flag
- Once-per-round abilities reset or update when the round advances
- Server tracks statuses, bonuses, and penalties
- Bonuses/penalties apply to the next relevant server-side or in-person roll
- Roll modifiers alter the d20 roll number and can change outcome tier
- Only one bonus or penalty can apply at a time
- GMs can consume an in-person bonus/penalty from the dashboard
- GM chooses which modifier to consume
- Some abilities target self only; some target other living characters only
- Global clues are visible only after admin marks them discovered for everyone
- Revealed global clues visible to everyone without requiring login
- Dead status visible on player list; dead logged-in characters get skull-and-crossbones header treatment and logout option
- Dead characters cannot be targeted by abilities
- Admin inventory management happens from one dashboard listing all characters
- Admin dashboard supports search by character name and player name
- Event logging is useful but low priority; server file logging is acceptable
- Public character page remains similar to existing page with grouped dropdowns/accordions
- Implementation priority: style first; shop/inbox/websockets second; rounds third
- Assets optional for now, with room to add later
- Preserve previous website features
- Add extended functionality later
- Use placeholders instead of generating creative content
