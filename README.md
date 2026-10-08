# Independent CI Smoke — Synthetic Only

This repository is a **standalone, public-safe test of GitHub Actions availability**. It uses fictional hotel names, made-up locations and intentionally fake private canary values. There is **no copied Antadi application code**, canonical pricing data, customers, credentials or private repository checkout.

## What the experiment verifies

- Node.js 24 and built-in `node:sqlite` with SQLite FTS5.
- A synthetic search function that does not disclose internal columns.
- Playwright Chromium at desktop (1280px) and mobile (390px) widths.
- Whether a public standard GitHub-hosted runner is actually assigned while the account's private-repo Actions are billing-blocked.

## Run policy

The GitHub workflow is **`workflow_dispatch` only**. Uploads and pushes must not trigger tests. It has `contents: read`, does not use secrets, does not deploy, and has a 12-minute timeout.

To run after this repository is **Public**, open **Actions → Manual synthetic CI smoke → Run workflow** once, and inspect job steps. Do not run it while the repo is private/billing-blocked.

Alternatively, on a local Node24 environment run:

```bash
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run test:all
```

A passing run demonstrates the generic CI environment, **not** Antadi V3 private app correctness, price parity, secure internal login, or live Cloudflare D1 acceptance.

## Security

Never add a private app repository as a checkout target, artifact, submodule or remote dependency. No private token, real hotel pricing, personal data, operational URL or commercial source files may enter this repository. Repository visibility changes require the owner's action in GitHub.
