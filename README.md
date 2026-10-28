# mottor-ai-front

React + TypeScript (Vite) SPA for **Mottor AI**, the *Mottor.ai Senior Full-Stack Challenge* ("Quote calculator with commercial rules").

> Working on this repo? Read [AGENTS.md](AGENTS.md) first. Following the specs is mandatory.

## Specs

This repo does **not** contain specs. The spec, the plan, the tasks and the fixtures live in **[mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs)** (spec-anchored, GitHub Spec Kit):

- Constitution: [`.specify/memory/constitution.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/.specify/memory/constitution.md)
- Feature specs: [`specs/`](https://github.com/Juanperezc/mottor-ai-specs/tree/main/specs) (`spec.md`, `plan.md`, `tasks.md`, `fixtures/`)

If a change alters behavior, update the spec in `mottor-ai-specs` **first**, then the code.

## Tech stack

| Area | Technology |
|---|---|
| UI | React |
| Language | TypeScript (strict) |
| Build tool | Vite |
| Real-time | [Laravel Echo](https://laravel.com/docs/broadcasting#client-side-installation) + `pusher-js`, connected to the backend's Laravel Reverb (import progress and errors) |
| API types | Generated with `openapi-typescript` from the OpenAPI published by [mottor-ai-back](https://github.com/Juanperezc/mottor-ai-back) (Scramble) |
| Tests | Vitest + Testing Library |
| Coverage | `@vitest/coverage-v8` |

## Quick start

```bash
git clone https://github.com/Juanperezc/mottor-ai-specs ../mottor-ai-specs
git clone https://github.com/Juanperezc/mottor-ai-back ../mottor-ai-back     # default BACK_PATH (API contract)
npm install
npm run gen:api   # API types from the backend's OpenAPI
npm run dev
npm test
```

## API types

The API contract is owned by `mottor-ai-back`, which generates it with Scramble. This repo never keeps its own copy. Types are generated into `src/api/schema.d.ts` (committed) from one of:

- the exported file in the backend repo: `${BACK_PATH:-../mottor-ai-back}/docs/api/openapi.json`;
- a running backend: `${VITE_API_URL}/docs/api.json` (Swagger UI at `/docs/api`).

Planned script:

```json
{
  "scripts": {
    "gen:api": "openapi-typescript ${BACK_PATH:-../mottor-ai-back}/docs/api/openapi.json -o src/api/schema.d.ts"
  }
}
```

## Test coverage

Planned script (added to `package.json` when the app is scaffolded):

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

With `@vitest/coverage-v8` installed (`npm i -D @vitest/coverage-v8`) and `coverage.provider: 'v8'` plus `reporter: ['text', 'html', 'lcov']` in `vitest.config.ts`:

```bash
npm run test:coverage
```

Where to look:

- Terminal: the text summary printed at the end of the run.
- HTML report: open `coverage/index.html`.
- CI: `coverage/lcov.info` (uploaded as a build artifact).

Set `coverage.thresholds` in `vitest.config.ts` to fail the run when coverage drops. `coverage/` is a build output and must not be committed.

### Current coverage

There is no application code yet, so there is no coverage to report. This table is updated when tests exist.

| Scope | Lines | Target |
|---|---|---|
| Domain (ticket preview, money formatting) | TBD | TBD |
| Components and pages | TBD | TBD |
| Total | TBD | TBD |

## Git flow

```text
staging ──► feat/<scope>-<description> ──PR──► staging ──PR (release)──► main
```

- Branch from `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
- PR to `staging` with green CI and review. Release with a PR from `staging` to `main`. No direct commits to `staging` or `main`.

## Conventional Commits

`<type>(<optional scope>): <imperative description>`. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `chore`, `revert`.

```text
feat(quotes): add dashboard filters synced with url

Spec: 001-quotes-mvp
Tasks: T018, T019
```

## Referencing the spec in PRs

Every PR body includes `Spec: <feature>` and `Tasks: T0xx, ...` (task IDs from `tasks.md` in mottor-ai-specs). After merging, tick the tasks `[x]` in mottor-ai-specs.
