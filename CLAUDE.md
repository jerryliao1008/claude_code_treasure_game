# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Interactive Treasure Box Game": a single-page React 18 + TypeScript app built with Vite, originally exported from Figma Make. It is a Claude Code course exercise. Work happens on the `initial` branch; `README.md` is the course walkthrough (step-by-step prompts such as adding sound effects, a key cursor, and a win/tie/loss result), not project documentation. Other remote branches (`complete`, `plugin-*`, `gh-pages`) hold the course's reference solutions.

## Commands

- `npm install` (no `node_modules` is committed)
- `npm run dev` - Vite dev server on port 3000, opens the browser
- `npm run build` - production build into `build/` (not `dist/`)

The working copy is on a Linux host (Node 22, npm 10) that is shared to Windows as `W:`. Run npm and git commands on that Linux host over SSH, not from Windows on the share: `node_modules` holds Linux-native binaries (esbuild, SWC, rollup), and Windows git rejects the share as "dubious ownership". Run the dev server there with `npm run dev -- --host --open false` so other machines can reach it.

There is no test runner, linter, or `tsconfig.json`; Vite (SWC plugin) transpiles TypeScript without type checking, so `npm run build` is the only check available.

## Architecture

- `index.html` -> `src/main.tsx` -> `src/App.tsx`. All game logic and UI live in `App.tsx`: three boxes, one randomly holding treasure (+$100), the others a skeleton (-$50); the game ends when the treasure is found or all boxes are open. Animations use `motion/react`.
- Media are plain relative imports: images in `src/assets/` (including the unused `key.png` for the cursor exercise), sound effects in `src/audios/`. The two `.mp3` files are imported in `App.tsx` but not played yet.
- `src/components/ui/` is the stock shadcn/ui component set (Radix + `class-variance-authority`, `cn()` in `utils.ts`). Only `Button` is used; treat these as library code.
- `@` aliases to `src/`.

## Styling caveat

`src/index.css` is a **precompiled Tailwind v4.1.3 output**, and Tailwind itself is not a dependency, so there is no Tailwind build step. Only utility classes already present in `index.css` work; a new class (e.g. `bg-purple-500`, `w-96`) silently has no effect. Check with grep before using a class, or use inline styles / plain CSS, or add Tailwind (`@tailwindcss/vite`) to the build. `src/styles/globals.css` holds the shadcn theme tokens but is not imported by `main.tsx`.

`src/guidelines/Guidelines.md` is the empty Figma Make template (no project rules).
