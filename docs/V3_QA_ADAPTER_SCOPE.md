# Antadi V3 Public QA Adapter Scope

## Goal

This public repository validates CI environment compatibility only. It is not a mirror of the private Antadi application.

## Allowed fixtures

- synthetic OAuth/JWT payloads
- synthetic SQLite rows
- generic Playwright navigation fixtures
- deterministic security contracts

## Forbidden content

- hotel rate tables
- canonical knowledge
- customer data
- employee data
- Cloudflare credentials
- D1 production bindings
- Google OAuth secrets

## Gate mapping

| Private gate | Public adapter |
| --- | --- |
| Node24 runtime | node fixture |
| jose verification | synthetic signing fixture |
| SQLite | isolated schema fixture |
| Chromium | generic browser fixture |

A public PASS proves the runner can execute the required technology stack. It does not approve production, authentication activation, pricing authority or deployment.
