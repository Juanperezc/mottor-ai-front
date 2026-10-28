# mottor-ai-front

SPA en React + TypeScript (Vite) para **Mottor AI**, el *Mottor.ai Senior Full-Stack Challenge* ("Calculadora de cotizaciones con reglas comerciales").

> ¿Vas a trabajar en este repo? Lee primero [AGENTS.md](AGENTS.md). Seguir las specs es obligatorio.

## Specs

Este repo **no** contiene specs. La spec, el plan, las tareas y los fixtures viven en **[mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs)** (spec-anchored, GitHub Spec Kit):

- Constitución: [`.specify/memory/constitution.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/.specify/memory/constitution.md)
- Specs de features: [`specs/`](https://github.com/Juanperezc/mottor-ai-specs/tree/main/specs) (`spec.md`, `plan.md`, `tasks.md`, `fixtures/`)

Si un cambio altera el comportamiento, actualiza **primero** la spec en `mottor-ai-specs` y después el código.

## Stack tecnológico

| Área | Tecnología |
|---|---|
| UI | React |
| Lenguaje | TypeScript (strict) |
| Herramienta de build | Vite |
| Tiempo real | [Laravel Echo](https://laravel.com/docs/broadcasting#client-side-installation) + `pusher-js`, conectado a Laravel Reverb del backend (progreso y errores de la importación) |
| Tipos de la API | Generados con `openapi-typescript` a partir del OpenAPI que publica [mottor-ai-back](https://github.com/Juanperezc/mottor-ai-back) (Scramble) |
| Tests | Vitest + Testing Library |
| Cobertura | `@vitest/coverage-v8` |

## Inicio rápido

```bash
git clone https://github.com/Juanperezc/mottor-ai-specs ../mottor-ai-specs
git clone https://github.com/Juanperezc/mottor-ai-back ../mottor-ai-back     # default BACK_PATH (API contract)
npm install
npm run gen:api   # API types from the backend's OpenAPI
npm run dev
npm test
```

## Tipos de la API

El contrato de la API es de `mottor-ai-back`, que lo genera con Scramble. Este repo nunca guarda una copia propia. Los tipos se generan en `src/api/schema.d.ts` (versionado en el repo) a partir de una de estas fuentes:

- el archivo exportado en el repo del backend: `${BACK_PATH:-../mottor-ai-back}/docs/api/openapi.json`;
- un backend en ejecución: `${VITE_API_URL}/docs/api.json` (Swagger UI en `/docs/api`).

Script previsto:

```json
{
  "scripts": {
    "gen:api": "openapi-typescript ${BACK_PATH:-../mottor-ai-back}/docs/api/openapi.json -o src/api/schema.d.ts"
  }
}
```

## Cobertura de tests

Script previsto (se agrega a `package.json` cuando se genere el scaffold de la app):

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Con `@vitest/coverage-v8` instalado (`npm i -D @vitest/coverage-v8`) y con `coverage.provider: 'v8'` y `reporter: ['text', 'html', 'lcov']` en `vitest.config.ts`:

```bash
npm run test:coverage
```

Dónde mirar:

- Terminal: el resumen en texto que se imprime al final de la ejecución.
- Reporte HTML: abre `coverage/index.html`.
- CI: `coverage/lcov.info` (se sube como artefacto del build).

Configura `coverage.thresholds` en `vitest.config.ts` para que la ejecución falle si baja la cobertura. `coverage/` es una salida del build y no se debe commitear.

### Cobertura actual

Todavía no hay código de la aplicación, así que no hay cobertura para reportar. Esta tabla se actualiza cuando existan tests.

| Alcance | Líneas | Objetivo |
|---|---|---|
| Dominio (vista previa del ticket, formato de montos) | TBD | TBD |
| Componentes y páginas | TBD | TBD |
| Total | TBD | TBD |

## Flujo de Git

```text
staging ──► feat/<scope>-<description> ──PR──► staging ──PR (release)──► main
```

- Crea la rama desde `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
- PR a `staging` con el CI en verde y review. El release se hace con un PR de `staging` a `main`. No se hacen commits directos a `staging` ni a `main`.

## Conventional Commits

`<type>(<optional scope>): <imperative description>`. Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `chore`, `revert`.

```text
feat(quotes): add dashboard filters synced with url

Spec: 001-quotes-mvp
Tasks: T018, T019
```

## Cómo referenciar la spec en los PR

La descripción de cada PR incluye `Spec: <feature>` y `Tasks: T0xx, ...` (los IDs de las tareas de `tasks.md` en mottor-ai-specs). Después del merge, marca las tareas como `[x]` en mottor-ai-specs.
