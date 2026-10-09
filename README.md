# Public Free CI — Independent Synthetic Smoke

This repository is a **public, standalone, fictional test fixture** to exercise a free standard GitHub runner. It is **not** the Antadi V3 application, and never imports, downloads, checks out or tests private Antadi source code, real prices, employees, bookings, customers, tokens or Cloudflare databases.

## What is now automated

- A push to **main** automatically runs tests **only** when a source file, a test file, package.json, or this workflow changes.
- Manual `workflow_dispatch` is still available; PRs and forks do not trigger this workflow.
- Only this repository is checked out; token persistence is disabled; permissions are `contents: read`; no secrets or deploy commands are allowed.
- Node 24 + `node:sqlite` FTS5 + Chromium at desktop/mobile sizes, plus public-only workflow security tests.
- A 12-minute job timeout and concurrency cancellation minimize wasted runner time.

## Important limits

**Passing public CI proves only generic open-source runner and fictional search/SQL/UI behavior.** It does **not** prove private Antadi code safety, canonical pricing accuracy, Cloudflare Access identity, tenant scoping, D1 live state, or deployment readiness. All real Internal V3 gates stay in the private repository and authorized private runtime.

## Safety policy

Never put Antadi proprietary source, pricing tables, commercial terms, personal data, internal URLs, credentials, secrets or a private repository checkout into public CI. Changes to the public workflow must stay reviewable; no private workflow is delegated to this repository. Do not change repository visibility back to Private while trying to use free public runners.

## Manual local verification

Requires Node 24 and Playwright Chromium:

```bash
npm install --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run test:all
```

No paid service or direct Cloudflare integration is required.
