---
description: Build the treasure game and deploy the static site to Vercel
argument-hint: "[preview]  (default: production)"
---

Deploy this project to Vercel.

Arguments: $ARGUMENTS
- empty: production deploy (`--prod`)
- `preview`: preview deploy (no `--prod`)

Rules:
- Run every npm / npx / git command on the Linux host that holds the working copy, over SSH (see CLAUDE.md). Do not run them from Windows on the `W:` share.
- The build output directory is `build/`, not `dist/`.
- Only the static front end is deployed. The Express + SQLite API in `server/` does not run on Vercel, so login and score history will not work on the deployed site; tell the user this in the final report.

Steps:
1. Check `git status`. If there are uncommitted changes, list them and ask whether to continue.
2. Run `npm run build` and stop with the error output if it fails.
3. Check that the Vercel CLI is logged in with `npx vercel whoami`. If not, stop and ask the user to log in themselves (interactive), e.g. `! ssh <linux-host> -t "cd <repo> && npx vercel login"`.
4. Deploy the prebuilt static folder:
   - production: `npx vercel deploy build --prod --yes`
   - preview: `npx vercel deploy build --yes`
5. Report the deployment URL from the CLI output, and remind the user that login / score history is not available on the deployed site.
