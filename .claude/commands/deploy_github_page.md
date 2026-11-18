---
description: Build the treasure game and publish the static site to GitHub Pages
---

Deploy this project to GitHub Pages.

Rules:
- Run every npm / npx / git / gh command on the Linux host that holds the working copy, over SSH (see CLAUDE.md). Do not run them from Windows on the `W:` share.
- Target repo: the `myrepo` remote (the user's own repo), never `origin` (the course repo).
- The build output directory is `build/`, not `dist/`. `vite.config.ts` uses `base: './'` so the build works under the `/<repo>/` sub-path.
- Only the static front end is published. The Express + SQLite API in `server/` does not run on GitHub Pages, so login and score history will not work on the published site; tell the user this in the final report.

Steps:
1. Check `git status`. If there are uncommitted changes, list them and ask whether to continue.
2. Read the owner/repo from `git remote get-url myrepo`. Check with `gh api repos/<owner>/<repo> --jq .private` that the repo is public; if it is private, stop and tell the user Pages needs a public repo on a free plan.
3. Run `npm run build` and stop with the error output if it fails.
4. Publish `build/` to the `gh-pages` branch of `myrepo`:
   `npx --yes gh-pages -d build --nojekyll -r "$(git remote get-url myrepo)" -m "Deploy to GitHub Pages"`
   (no `--dotfiles`: `build/.vercel/` holds the Vercel project link and must not be published)
5. Make sure Pages serves the `gh-pages` branch:
   - `gh api repos/<owner>/<repo>/pages` fails (404): create it with `gh api -X POST repos/<owner>/<repo>/pages -f "source[branch]=gh-pages" -f "source[path]=/"`
   - otherwise leave it as is.
6. Report the site URL `https://<owner>.github.io/<repo>/` (first publish can take a minute or two), and remind the user that login / score history is not available on the published site.
