# Antadi V3 Public QA Boundary

This repository is only a free CI validation sandbox.

## Purpose

Validate generic tooling:

- Node 24 runner availability
- SQLite test execution patterns
- Chromium/Playwright browser execution
- workflow security rules

## Not included

Never copy:

- private Antadi V3 source code
- canonical hotel knowledge
- real rate data
- customer or employee data
- OAuth secrets
- Cloudflare tokens
- D1 production data

## Integration rule

Private Antadi repository remains the source of truth.

Public CI results are environment evidence only. They do not replace private release gates.

The intended flow is:

Private PR → sanitized QA fixture → public CI → evidence → private review.
