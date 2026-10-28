# AGENTS.md

Mandatory rules for any AI agent or person working on `mottor-ai-front`. Follow them on every task.

## Source of truth: mottor-ai-specs

1. **Read the specs before any task.** Open [mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs) and read:
   - the constitution: `.specify/memory/constitution.md`;
   - the feature spec in `specs/<feature>/`: `spec.md`, `plan.md`, `tasks.md` and `fixtures/`.
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
