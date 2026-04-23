# Incident on Planet Sinker 

A space western murder mystery party website built with Bootstrap and Alpine.js.

## Project Overview

This is a companion website for an interactive murder mystery party game set in a dystopian space western universe. Players assume character roles and investigate clues to solve a murder on Planet Sinker

## Features

- **Character Selection**: Players select their character from a dropdown menu showing character name, blurb, and real player name
- **Rules Page**: Clear instructions on how the murder mystery game works
- **Character Profiles**: Detailed information on all 6 playable characters with extended bios
- **Dark Space Western Theme**: Dramatic neon styling with a mysterious cosmic aesthetic
- **Mobile Responsive**: Fully functional on mobile and desktop devices
- **GitHub Pages Ready**: Automated deployment via GitHub Actions

## Project Structure

```
incident_on_planet_sinker/
├── index.html              # Landing page with character selection
├── rules.html              # Game rules and how-to-play
├── characters.html         # Full character profiles
├── css/
│   └── style.css          # Custom dark theme styles
├── js/
│   └── app.js             # Alpine.js components
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Pages auto-deploy
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Setup

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Development**: Simply serve the files locally:
   ```bash
   npm run dev
   ```
   Or open `index.html` directly in a browser.

3. **Customize**:
   - Edit character names and bios in `index.html` and `characters.html`
   - Update player names in the character selection
   - Modify rules content in `rules.html`
   - Adjust the theme colors in `css/style.css` (CSS variables at the top)

## Deployment to GitHub Pages

1. Push to your `main` branch:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
   - Install dependencies
   - Deploy your site to GitHub Pages
   - Your site will be available at: `https://yourusername.github.io/murder_site/`

3. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Set source to "GitHub Actions"

## Customization Guide

### Change the Theme Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-neon: #00ff88;      /* Green neon */
    --secondary-neon: #ff0080;    /* Pink neon */
    --dark-bg: #0a0e27;          /* Dark space background */
    /* ... more colors ... */
}
```

### Add/Edit Characters
All 6 character slots are pre-built. To modify:
1. Edit the character data in `js/app.js` 
2. Update the character cards in `characters.html`
3. Ensure the dropdown in `index.html` matches the character IDs

### Next Steps: Add Clue Pages
Once you have the core site running, you can:
- Create additional pages for clue investigations
- Add interactive elements with Alpine.js
- Create printable character sheets
- Add a gallery for mystery photos

## Technologies Used

- **HTML5**: Semantic markup
- **Bootstrap 5**: Responsive grid and components
- **Alpine.js**: Lightweight reactive components
- **CSS3**: Custom animations and theming
- **GitHub Actions**: Automated deployment

## Game Running Tips

- Set the mood: Play the site on a big screen before gameplay
- Make copies of character profiles for players
- Print out any clue cards or evidence
- Use the character selection screen as the "entry point" to the investigation
- The site works offline once loaded

## License

All content is your own. Feel free to modify and redistribute as needed.

---

**Created for: Incident On Planet Sinker - A Space Western Mystery**  
*2026*
