# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Interactive Treasure Box Game": a single-page React 18 + TypeScript app built with Vite, originally exported from Figma Make. It is a Claude Code course exercise. Work happens on the `initial` branch; `README.md` is the course walkthrough (step-by-step prompts such as adding sound effects, a key cursor, and a win/tie/loss result), not project documentation. Other remote branches (`complete`, `plugin-*`, `gh-pages`) hold the course's reference solutions.

## Commands

- `npm install` (no `node_modules` is committed)
- `npm run dev` - starts both the Vite dev server (port 3000, `strictPort`) and the API server (port 3001) via `concurrently`; extra args after `--` go to Vite only
- `npm run dev:web` - Vite only; `npm run server` - API only (`API_PORT` env overrides 3001)
- `npm run build` - production build into `build/` (not `dist/`); the build has no API, login only works under the dev server

The working copy is on a Linux host (Node 22, npm 10) that is shared to Windows as `W:`. Run npm and git commands on that Linux host over SSH, not from Windows on the share: `node_modules` holds Linux-native binaries (esbuild, SWC, rollup), and Windows git rejects the share as "dubious ownership". Run the dev server there with `npm run dev -- --host --open false` so other machines can reach it.

There is no test runner, linter, or `tsconfig.json`; Vite (SWC plugin) transpiles TypeScript without type checking, so `npm run build` is the only check available.

## Architecture

- `index.html` -> `src/main.tsx` -> `src/App.tsx`. All game logic and UI live in `App.tsx` (state: `boxes`, `score`, `gameEnded`): three boxes, one randomly holding treasure (+$50), the others a skeleton (-$50); the game ends when the treasure is found or all boxes are open, then a WIN / TIE / LOSS badge (sign of the final score) appears beside the score and "Play Again" re-runs `initializeGame()`. The +/-$50 amounts appear both in the scoring logic and in display strings; change them together. Animations use `motion/react`.
- Login and score history: `server/index.mjs` (Express) + `server/db.mjs` (built-in `node:sqlite`, Node >= 22.13; DB file `server/data/game.db`, git-ignored, schema created on start). Passwords are scrypt-hashed; the session is a random token in the `sessions` table sent as an HttpOnly `sid` cookie. Endpoints: `POST /api/register|login|logout`, `GET /api/me`, `GET|POST /api/scores`. Inserting a score trims that user's rows to the latest 100 (`MAX_SCORES_PER_USER`). Vite proxies `/api` to port 3001.
- Front end: `src/api.ts` (fetch helpers), `src/AuthPanel.tsx` (login / sign up / logout bar), `src/ScoreHistory.tsx` (list shown only when logged in). `App.tsx` saves the final score when `gameEnded` becomes true and a user is logged in; guests save nothing. Logging in or out resets the current round.
- Media are plain relative imports: images in `src/assets/`, sound effects in `src/audios/`. Opening a box plays `chest_open.mp3` (treasure) or `chest_open_with_evil_laugh.mp3` (skeleton) via `new Audio(...)`; `key.png` is the custom cursor on unopened boxes while the game is running, set through an inline `style` cursor (Tailwind classes cannot express it).
- `src/results/` holds course reference screenshots (e.g. `key_hover.png`), not app code.
- `src/components/ui/` is the stock shadcn/ui component set (Radix + `class-variance-authority`, `cn()` in `utils.ts`). Only `Button` and `Input` are used; treat these as library code. `src/components/figma/ImageWithFallback.tsx` is an unused Figma Make helper.
- `@` aliases to `src/`. `vite.config.ts` also aliases versioned specifiers (`'vaul@1.1.2'` -> `vaul`, etc.) because Figma Make emits imports with version suffixes; keep these aliases in sync when adding or upgrading packages.

## Styling caveat

`src/index.css` is a **precompiled Tailwind v4.1.3 output**, and Tailwind itself is not a dependency, so there is no Tailwind build step. Only utility classes already present in `index.css` work; a new class (e.g. `bg-purple-500`, `w-96`) silently has no effect. Check with grep before using a class, or use inline styles / plain CSS, or add Tailwind (`@tailwindcss/vite`) to the build. `src/styles/globals.css` holds the shadcn theme tokens but is not imported by `main.tsx`.

`src/guidelines/Guidelines.md` is the empty Figma Make template (no project rules).
