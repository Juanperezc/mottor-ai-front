# AGENTS.md

Mandatory rules for any AI agent or person working on `mottor-ai-front`. Follow them on every task.

## Source of truth: mottor-ai-specs

1. **Read the specs before any task.** Open [mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs) and read:
   - the constitution: `.specify/memory/constitution.md`;
   - the feature spec in `specs/<feature>/`: `spec.md`, `plan.md` and `tasks.md`. Test fixtures live in `mottor-ai-back` (`tests/Fixtures/`); this repo keeps byte-identical copies in `src/mocks/` and `src/shared/ticket/__fixtures__/`.
2. **No spec, no code.** Do not write code unless a spec requirement and a task in `tasks.md` back it.
3. **The spec wins.** If code and spec disagree, the spec is right. Stop, and propose the change as a PR to `mottor-ai-specs`. Change code only after the spec is updated.
4. **Never create specs here.** No `spec.md`, `plan.md`, `tasks.md` or `fixtures/` in this repo. Specs live only in `mottor-ai-specs`.
5. **Follow the backend contract.** Request and response shapes come from the OpenAPI published by `mottor-ai-back` (`docs/api/openapi.json` in that repo, or `/docs/api.json` on a running backend). Do not add, rename or drop fields on your own; contract changes are made in `mottor-ai-back`.

## Git workflow

6. Branch from `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
7. Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <imperative summary>`.
8. Open the PR to `staging`. Release with a PR from `staging` to `main`. Never push directly to `staging` or `main`.
9. Every PR body references the spec and the tasks it implements:

   ```text
   Spec: 001-quotes-mvp
   Tasks: T021, T023
   ```

   Docs or chores with no spec use `Spec: N/A (docs)` and `Tasks: N/A`.

## Language

10. Code, identifiers, comments, commits and docs in this repo: **English**.
11. Specs in `mottor-ai-specs`: **Spanish**.

## Quality

12. Keep tests green. Add or update tests with every behavior change, using the spec fixtures as test cases.
13. Do not lower test coverage. Run the coverage command in `README.md` before opening a PR.
14. If you are unsure, stop and ask. Do not guess requirements.

## Frontend specifics

15. Generate API types from the backend's OpenAPI (`npm run gen:api`). Do not hand-write API types.
16. Use strict TypeScript. No `any` without a comment explaining why.
17. Run `npm run test:coverage` before opening a PR.

## UI: tokens and the shared template

18. **No arbitrary Tailwind values** (`leading-[18px]`, `text-[10px]`, `w-[…]`, `shadow-[…]`, …). Every size, color, spacing, shadow and width comes from a token in `@theme` (`src/index.css`, copied from the Paper file "Mottor AI – Quotes UI"). If the design needs a value that has no token, add the token first (e.g. `--text-brand: 14px` + `--text-brand--line-height: 18px` → `text-brand`), then use it. ESLint (`no-restricted-syntax`) fails on `-[` inside `className`.
19. **Repeated class combos become a `@utility`** in `src/index.css` once they appear 3 or more times (`eyebrow`, `eyebrow-sm`, `caption-mono`, `heading-section`, `px-page`, `card`, `btn-*`, `field`). Do not copy a long class string into a new component.
20. **Repeated markup becomes a component** in `src/shared/ui/` once it appears in 2 or more places. Use the template before writing new markup:

    | Component                                            | Use it for                                                                  |
    | ---------------------------------------------------- | --------------------------------------------------------------------------- |
    | `PageHeader`                                         | Page title block (back link, title, subtitle, right-side actions or totals) |
    | `Banner`                                             | Full-width success / warning / error strip with optional action             |
    | `Pill`                                               | Rounded status badge ("Procesando", "Sin tasa")                             |
    | `IconText`                                           | Icon + text in one tone ("✓ 500 importados")                                |
    | `StatCard`                                           | Label + big number inside a `<dl>`                                          |
    | `Field` + `Select`                                   | Visible label, control and hint wired by ids                                |
    | `IconButton`                                         | Icon-only button; `aria-label` is required                                  |
    | `Th` + `TableScroll`                                 | Eyebrow column headers and horizontally scrollable tables                   |
    | `Modal`                                              | Dialog with focus trap, Esc and focus return                                |
    | `EmptyState`, `ErrorState`, `Pagination`, `BackLink` | List states and navigation                                                  |

    Tones (`neutral`, `accent`, `success`, `warning`, `error`) come from `shared/ui/tone.ts`; do not map tone → color again in a feature. Components used by more than one feature live in `shared/`, never imported from another feature.

## React performance: `useMemo`, `useCallback`, `memo`

21. Use them **when they prevent real work**, not by default:
    - `useCallback` for functions passed to a `memo` child, used in an effect's dependencies, or returned from a custom hook (`useFilters().update`).
    - `useMemo` for derived data that is expensive (parsing, `JSON.stringify` of quotes, `lines()`, grouping 422 errors) or that is passed to a `memo` child or an effect.
    - `memo` for list rows and cards that can be many (batch rows, the 50 quote rows, up to 500 error cards) when the parent re-renders often.
22. Keep fast-ticking state (timers, inputs) in the smallest component that needs it, so the rest of the tree does not re-render (e.g. `ElapsedStat` in `BatchProgress`). Store actions from Zustand and `useState` setters are already stable: do not wrap them.
