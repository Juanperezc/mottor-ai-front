# mottor-ai-front

SPA en React + TypeScript (Vite) de **Mottor AI** (*Mottor.ai Senior Full-Stack Challenge*).

## Specs

Este repo **no** contiene specs. La spec, el contrato OpenAPI, el plan y las tareas viven en **[mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs)** (enfoque spec-anchored):

- Spec actual: [`specs/001-quotes-mvp/spec.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/specs/001-quotes-mvp/spec.md)
- Plan y tareas de este repo: [`specs/001-quotes-mvp/frontend/`](https://github.com/Juanperezc/mottor-ai-specs/tree/main/specs/001-quotes-mvp/frontend)
- Contrato: [`specs/001-quotes-mvp/contracts/openapi.yaml`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/specs/001-quotes-mvp/contracts/openapi.yaml)
- Constitución: [`.specify/memory/constitution.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/.specify/memory/constitution.md)

Si un cambio altera comportamiento, **primero** se actualiza la spec en `mottor-ai-specs` y después el código.

## Setup rápido

```bash
git clone https://github.com/Juanperezc/mottor-ai-specs ../mottor-ai-specs   # SPECS_PATH por defecto
npm install
npm run gen:api   # tipos desde $SPECS_PATH/specs/001-quotes-mvp/contracts/openapi.yaml
npm run dev
npm test          # Vitest + Testing Library + vitest-axe
```

Detalle: `specs/001-quotes-mvp/frontend/quickstart.md` en mottor-ai-specs.

## Git flow

```text
staging ──► feat/<scope>-<descripcion> ──PR──► staging ──PR (release)──► main
```

- Las ramas salen de `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
- PR a `staging` con CI verde y review. Para liberar, PR de `staging` a `main`. Sin commits directos a `staging` ni a `main`.

## Conventional Commits

`<type>(<scope opcional>): <descripción en imperativo>`. Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `chore`, `revert`.

```text
feat(quotes): add dashboard filters synced with url

Spec: 001-quotes-mvp
Tasks: T018, T019
```

## Referenciar la spec en PRs

Completá la plantilla [`.github/pull_request_template.md`](.github/pull_request_template.md): `Spec: 001-quotes-mvp` y `Tasks: T0xx, ...` (IDs de `frontend/tasks.md`). Al mergear, marcá las tareas `[x]` en mottor-ai-specs.
