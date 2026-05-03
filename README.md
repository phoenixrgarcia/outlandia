# Otherwordly Occurance in Outlandia

A murder mystery party companion site, currently being adapted from the first space western iteration into a medieval fantasy royal court version.

The current repository is both:

- A working static prototype from the original **Incident on Planet Sinker** game
- A template/codebase for the next Outlandia iteration

The full implementation intent for the new version lives in:

[agent/outlandia-update-spec.md](agent/outlandia-update-spec.md)

## Project Direction

The next version will retheme the site for a Dungeons & Dragons inspired royal court mystery. Creative story content, final character text, clues, and worldbuilding will be supplied later by human writers/actors. Placeholder text should be used until then.

Planned high-level changes:

- Medieval fantasy royal court visual theme
- Searchable character login for around 40 playable characters
- Placeholder character factions: Royal Court, Laborers, Knights, Fae
- Private character sections for inventory, goals, secret, twist, and relationships
- Node.js and Express backend
- MongoDB-backed game data
- Render deployment target
- Simple character password login with local-storage tokens
- GM/admin characters with both player features and admin dashboard access
- Shop, inbox, websocket notifications, inventory management, abilities, statuses, and round support

Implementation priority:

1. Update the existing site style to the new medieval fantasy royal court theme.
2. Add shop, inbox, and websocket/realtime functionality.
3. Add rounds functionality.

## Current Features

The existing static site includes:

- Home page with character login/selection
- Rules page
- Lore page
- Character listing page
- Database/evidence-style page
- Character-specific authenticated details
- Bootstrap and Alpine.js frontend behavior
- Responsive styling

## Project Structure

```text
outlandia/
├── agent/
│   └── outlandia-update-spec.md  # AI-facing implementation intent
├── css/
│   └── style.css                 # Current custom theme styles
├── images/                       # Current image assets
├── js/
│   └── app.js                    # Current Alpine.js app logic
├── index.html                    # Home and character login
├── lore.html                     # Lore page
├── rules.html                    # Rules page
├── characters.html               # Public character list
├── database.html                 # Current database/evidence page
├── detail_characters.txt         # Current detailed character content
├── package.json
└── README.md
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your local values:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/outlandia
JWT_SECRET=replace-with-a-long-random-secret
PORT=3000
NODE_ENV=development
TOKEN_TTL=12h
```

Do not commit `.env`; it is ignored because it will contain secrets. Commit `.env.example` only.

Run the Express-backed local site:

```bash
npm run dev
```

Run the static prototype directly:

```bash
npm run dev:static
```

You can also open `index.html` directly in a browser while static Phase 1 behavior is still being migrated.

## Development Notes

- Treat `agent/outlandia-update-spec.md` as the source of truth for upcoming changes.
- Do not generate final mystery content, final clues, final character secrets, or final worldbuilding.
- Use placeholders when implementation requires content.
- Keep future server-side work aligned with Node.js, Express, MongoDB, and Render.
- Avoid hard-coding assumptions that only work for the current six-character prototype.

## Technologies

Current prototype:

- HTML5
- CSS3
- Bootstrap 5
- Alpine.js

Planned backend direction:

- Node.js
- Express
- MongoDB
- Websockets or equivalent realtime channel
- Render deployment

## License

All custom content is project-owned and intended for adaptation within this murder mystery site.
