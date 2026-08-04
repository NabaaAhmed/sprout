# 🌱 Sprout — Cozy Pixel Study Companion

A pixel-art virtual pet that grows for real when you study.

Run focus sessions, earn Sprout Points (SP), and watch your tiny companion evolve from a Seedling into an Ancient Bloom — all powered by your actual study time. No login, no backend, just you and your buddy.

## Features (MVP)

- **Home screen** — your pet, its mood, affection & growth stats, and a big "Start Focus Session" button.
- **Focus Timer** — 15/25/45/60 min presets or a custom duration, optional task label, ambient scene that shifts tone as time passes, and a no-punishment "Give up" escape hatch.
- **Session rewards** — completing a session earns SP (`floor(minutes * 0.6)` + a streak bonus), fully restores affection, and can trigger an evolution.
- **Shop** — spend SP on food (feed for bonus affection), room decor, outfits, and seasonal cosmetics.
- **Journal** — a GitHub-style contribution heatmap of daily study activity, total hours, streaks, and session history.
- **Pet Stats** — affection meter, growth progress toward the next evolution stage, and a feeding station.
- **Streaks** — consecutive days with a completed session build a streak flame. Missing a day just resets the flame — never your progress.
- **Persistence** — everything is saved to `localStorage`, so your pet is right where you left it next time.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) (JSX, no TypeScript for MVP simplicity)
- [Tailwind CSS](https://tailwindcss.com/) for layout, plus hand-rolled CSS for pixel-style buttons/panels and keyframe animations
- React Context (`GameContext`) + a small `usePersistedState` hook for state + localStorage sync
- Google Fonts: **Pixelify Sans** & **Silkscreen** (display/pixel headers), **Nunito** (body/UI)
- Placeholder emoji "sprites" for the pet, food, decor, and outfits — swap in real pixel art via `public/sprites/` whenever it's ready, no logic changes needed

## Getting started

This project needs Node.js 18+ (Node 20 recommended).

```bash
cd sprout
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

### Deploying to GitHub Pages

The MVP is a fully static site — no backend required. The simplest path:

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:

```json
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
}
```

Set `base: '/your-repo-name/'` in `vite.config.js` if deploying to a project page (not a custom domain), then run `npm run deploy`.

## Project structure

```
sprout/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/       # PetDisplay, FocusTimer, Shop, Journal, PetStats, NavTabs, TopBar, ...
│   ├── context/
│   │   └── GameContext.jsx   # all game state, persistence, and game-logic actions
│   ├── data/
│   │   ├── petStages.js      # evolution stage thresholds
│   │   └── shopItems.js      # shop catalog
│   ├── hooks/
│   │   ├── usePersistedState.js
│   │   └── useTimer.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css        # CSS variables, pixel button/panel styles, global look
├── tailwind.config.js    # Sprout color palette + font families + keyframes
└── package.json
```

## Design notes

- **Color palette** and **fonts** are defined in `tailwind.config.js` (`sprout.*` colors, `font-pixel` / `font-display` / `font-body`), matching the spec exactly.
- **Evolution stages** (`src/data/petStages.js`): Seedling (0–5 hrs) → Sprig (5–20 hrs) → Bloom (20–50 hrs) → Ancient Bloom (50+ hrs), tracked via cumulative `totalFocusMinutes`.
- **Affection** is restored to 100 by any completed session, decays gently (-5/day, floor of 20) if you've been away, and can be topped up anytime by feeding purchased food.
- **Abandoned sessions** ("Give up") are logged in the journal for transparency but never earn SP, streak credit, or growth — low pressure by design.

## Stretch goals (not yet implemented)

Multiple pet species, seasons/weather tied to real dates, ambient lo-fi audio, cloud sync, milestone "letters," shareable stat cards, and an achievements list. See the original design spec for details.
