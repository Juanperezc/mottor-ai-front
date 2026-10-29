# mottor-ai-front

[![Release](https://img.shields.io/badge/release-v0.1.0-blue)](https://github.com/Juanperezc/mottor-ai-front/releases)
[![Tests](https://img.shields.io/badge/tests-112%20passed-brightgreen?logo=vitest&logoColor=white)](#cobertura)
[![Cobertura](https://img.shields.io/badge/coverage-97.97%25-brightgreen)](#cobertura)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node](https://img.shields.io/badge/Node-20-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Demo](https://img.shields.io/badge/demo-vercel-000000?logo=vercel&logoColor=white)](https://mottor-ai-front.vercel.app/quotes)

SPA en React + TypeScript (Vite) de **Mottor AI** ([_Mottor.ai Senior Full-Stack Challenge_](docs/enunciado.html): "Calculadora de presupuestos con reglas comerciales"). Importa `dataset.json` en lotes, lista los presupuestos con conversión de moneda y muestra el detalle con el desglose regla por regla. No recalcula montos: el motor de reglas vive en [`mottor-ai-back`](https://github.com/Juanperezc/mottor-ai-back).

## Demo y enunciado

| Qué                                                                    | Dónde                                                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Front (este repo)                                                      | https://mottor-ai-front.vercel.app/ (la app arranca en [`/quotes`](https://mottor-ai-front.vercel.app/quotes)) |
| API ([`mottor-ai-back`](https://github.com/Juanperezc/mottor-ai-back)) | https://mottor.tulinkfacil.com/                                                                                |
| Enunciado del challenge                                                | [`docs/enunciado.html`](docs/enunciado.html)                                                                   |
| Diseño (Paper)                                                         | [Mottor AI – Quotes UI](https://app.paper.design/file/01M61XGWQBFD5567G483VM9SMK/p-1-0)                        |
| Specs (SDD)                                                            | [`mottor-ai-specs`](https://github.com/Juanperezc/mottor-ai-specs)                                             |

El enunciado es el HTML original, sin cambios. GitHub lo muestra como código: para leerlo con formato, descargalo y abrilo en el navegador. El deploy de Vercel apunta a la API publicada (`VITE_API_URL=https://mottor.tulinkfacil.com`).

## Specs

Este repo **no** contiene specs. La spec, el plan y las tareas viven en **[mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs)** (enfoque spec-anchored):

- Spec: [`specs/001-quotes-mvp/spec.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/specs/001-quotes-mvp/spec.md)
- Plan y tareas (FT-01 a FT-27): [`plan.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/specs/001-quotes-mvp/plan.md) y [`tasks.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/specs/001-quotes-mvp/tasks.md)
- Decisiones: [`docs/decisions.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/docs/decisions.md) (ADR-00 a ADR-09)
- Constitución: [`.specify/memory/constitution.md`](https://github.com/Juanperezc/mottor-ai-specs/blob/main/.specify/memory/constitution.md)

El **contrato de la API** lo genera el back con Scramble: [`mottor-ai-back/docs/api/openapi.json`](https://github.com/Juanperezc/mottor-ai-back/blob/staging/docs/api/openapi.json) (Swagger UI en `/docs/api` del back corriendo). Si un cambio altera comportamiento, **primero** se actualiza la spec y después el código.

## Tecnologías

| Tema        | Elección                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Base        | React 19, TypeScript 5 (`strict`, `noUncheckedIndexedAccess`), Vite 8, React Router 7                                    |
| Estado      | Zustand 5 (un store por feature; `persist` para la configuración). Sin TanStack Query (ADR-02)                           |
| API         | `openapi-fetch` con tipos generados por `openapi-typescript` desde el OpenAPI del back (`src/api/schema.d.ts`)           |
| Tiempo real | Laravel Echo + `pusher-js` contra Reverb (solo en el modo de importación con cola)                                       |
| UI          | Tailwind CSS 4 con los tokens del archivo de Paper "Mottor AI – Quotes UI", Lucide Icons, fuentes Geist y Geist Mono     |
| Tests       | Vitest 4 + Testing Library + user-event, jsdom 27, `vitest-axe` (WCAG) y MSW 2 (mock de la API), compatibles con Node 20 |
| Calidad     | ESLint (`typescript-eslint` strict, `jsx-a11y`, `react-hooks`) y Prettier                                                |

## Diseño

La UI sale del archivo de Paper **[Mottor AI – Quotes UI](https://app.paper.design/file/01M61XGWQBFD5567G483VM9SMK/p-1-0)**, que es público y se puede compartir. De ahí vienen las pantallas (listado, detalle con ticket, importación y modal de errores) y los tokens de `src/index.css` (colores, tipografía, espaciado). El estilo visual toma como referencia la sección de módulos de [mottor.ai](https://mottor.ai/#modules).

## Cómo correrlo

Requiere Node 20.19 o más nuevo (`.nvmrc`: 20; también corre en 22 y 24) y el back corriendo con Sail (`sail up -d` en `mottor-ai-back`).

```bash
cp .env.example .env    # y ajustalo según "Configurar el .env"
npm install
npm run dev             # http://localhost:<DEV_PORT>
```

### Configurar el .env

El front necesita tres datos del back: dónde está la API, cómo conectarse a Reverb y en qué origen lo deja pasar CORS. Todos salen del `.env` de `mottor-ai-back`.

| Variable (front)      | Default (`.env.example`) | De dónde sale en el `.env` del back                                           |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `VITE_API_URL`        | `http://localhost`       | `APP_URL` (o `http://localhost:<APP_PORT>`), sin `/api`                       |
| `VITE_REVERB_APP_KEY` | `mottor-ai-key`          | `REVERB_APP_KEY`                                                              |
| `VITE_REVERB_HOST`    | `localhost`              | `localhost` (el `REVERB_HOST=reverb` del back es el nombre interno de Docker) |
| `VITE_REVERB_PORT`    | `8080`                   | `REVERB_SERVER_PORT` (el puerto que Sail publica en el host)                  |
| `VITE_REVERB_SCHEME`  | `http`                   | `REVERB_SCHEME`                                                               |
| `DEV_PORT`            | `5173`                   | Tiene que coincidir con `FRONTEND_URL` (CORS). No se expone a la app          |

`vite` arranca con `strictPort`: si `DEV_PORT` está ocupado falla en vez de saltar a otro puerto, porque CORS solo acepta el origen exacto de `FRONTEND_URL`.

#### Ejemplo: Sail local de este proyecto

Con el back así (`APP_PORT=8000`, `REVERB_SERVER_PORT=8081`), Sail además publica el `5173` para el Vite propio de Laravel, así que el front usa el `5174`:

```dotenv
# mottor-ai-front/.env
VITE_API_URL=http://localhost:8000
VITE_REVERB_APP_KEY=<REVERB_APP_KEY del back>
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8081
VITE_REVERB_SCHEME=http
DEV_PORT=5174
```

```dotenv
# mottor-ai-back/.env
FRONTEND_URL=http://localhost:5174
```

`FRONTEND_URL` no necesita reiniciar Sail (`artisan serve` relee el `.env` en cada request), salvo que hayas corrido `php artisan config:cache`; en ese caso, `sail artisan config:clear`. Vite sí relee su `.env` solo cuando cambia.

#### Verificarlo

```bash
# API arriba
curl http://localhost:8000/health                         # {"status":"ok"}
# CORS: Access-Control-Allow-Origin tiene que ser tu origen
curl -si -X OPTIONS http://localhost:8000/quotes/batch \
  -H 'Origin: http://localhost:5174' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -i allow-origin
```

En el navegador:

1. `/quotes` lista los presupuestos. Si aparece "No pudimos cargar los presupuestos", revisá `VITE_API_URL` y CORS en la consola del navegador.
2. En el panel de configuración (botón abajo a la derecha) elegí "Con cola" e importá un archivo. En la pestaña Network → WS tiene que haber una conexión a `ws://localhost:8081/app/<key>` y la tarjeta tiene que decir `canal imports.{id}`. Si dice `consultando GET /imports/{id}`, el socket no está llegando (revisá `VITE_REVERB_*` y que el contenedor `reverb` esté arriba); la importación igual termina por polling.

### Scripts

| Comando                 | Qué hace                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                                                                             |
| `npm run dev:mock`      | Igual, pero con la API simulada por MSW (handlers y fixtures en `src/mocks/`), sin back            |
| `npm run build`         | Typecheck + build de producción en `dist/`                                                         |
| `npm test`              | Todos los tests (Vitest)                                                                           |
| `npm run test:coverage` | Tests con cobertura (umbral 80%)                                                                   |
| `npm run lint`          | ESLint + Prettier (`--check`)                                                                      |
| `npm run gen:api`       | Regenera `src/api/schema.d.ts` desde `../mottor-ai-back/docs/api/openapi.json` (o `BACK_PATH=...`) |

## Cómo probar la importación

El back trae datasets de prueba con el mismo formato que `dataset.json`, en [`mottor-ai-back/database/datasets/`](https://github.com/Juanperezc/mottor-ai-back/blob/staging/database/datasets/README.md). En ese README está el detalle de cada caso: rutas de error, renglones del ticket y cómo regenerarlos.

Con el back y el front corriendo, abrí `/import`, elegí el modo en el panel flotante (sincrónico por defecto) y arrastrá el archivo:

| Archivo                  | Presupuestos | Qué esperar                                                                                                                                                                  |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valid-small.json`       | 20           | 1 lote importado. Cubre las 3 monedas, la tasa inversa y los 6 tipos de regla                                                                                                |
| `valid-multi-batch.json` | 1.200        | 3 lotes (500 + 500 + 200), todos importados. Con cola se ve el progreso por lote en vivo                                                                                     |
| `official-cases.json`    | 2            | Totales 4.722.388,00 (`PRE-2026-0418`) y 7.832.871,49 (`PRE-2026-0419`) en el detalle                                                                                        |
| `errors-one-batch.json`  | 1.200        | El lote 2 se rechaza (`quotes.242` → `budget.items.0.quantity`) y los lotes 1 y 3 se importan (700)                                                                          |
| `errors-mixed.json`      | 34           | El modal muestra primero 16 errores juntos. Después, cada "Reintentar lote" muestra 1 error de dominio nuevo (9 en total) hasta que el lote entra                            |
| `ticket-edge.json`       | 12           | Se importan todos. En el detalle, el ticket muestra los bordes de 28 × 4: acentos, emojis, banderas, ZWJ, palabras largas y `…`                                              |
| `invalid-json.json`      | —            | Se rechaza antes de enviar: "El archivo no es un JSON válido."                                                                                                               |
| `empty-quotes.json`      | 0            | Se rechaza antes de enviar: "El archivo no tiene presupuestos."                                                                                                              |
| `wrong-shape.json`       | 3            | Se rechaza antes de enviar, porque falta la clave `quotes`                                                                                                                   |
| `too-many.json`          | 10.001       | Se genera con un script (no está versionado). Con cola, `422` en `quotes` (máximo 10.000). En modo sincrónico entra completo en 21 lotes, porque el front no limita el total |

## Arquitectura

```text
src/
  app/            router (/quotes, /quotes/:id, /import), AppShell, SettingsPanel (panel flotante)
  features/
    quotes/       QuotesPage (tabla en desktop, tarjetas en mobile) · useQuotesStore (filtros en la URL, 50 por página)
    quote-detail/ QuoteDetailPage · useQuoteDetailStore · TicketPreview
    import/       ImportPage · useImportStore (sync y cola) · BatchProgress · ImportErrorsModal · parseDataset
  shared/
    money/        formatMoney (Intl es-AR, sin aritmética)
    ticket/       lines.ts (28×4 por code point), TicketRows + copia de ticket-cases.json
    settings/     useSettingsStore (localStorage "mottor.settings")
    realtime/     createEcho() y subscribeImport(id, handlers)
    http/         groupErrorsByQuote (422 → presupuesto y ruta exacta)
    ui/           template de UI: PageHeader, Banner, Pill, IconText, StatCard, Field/Select, IconButton,
                  Th/TableScroll, Modal, EmptyState, ErrorState, Pagination, BackLink (reglas en AGENTS.md)
  api/            schema.d.ts (generado) y client.ts (openapi-fetch + ApiError)
  mocks/          handlers de MSW y fixtures del caso oficial
```

Los componentes no llaman a `fetch`: usan acciones de los stores, que usan el cliente tipado. Los efectos del modo con cola (`subscribe`, intervalo de polling, timeout) están en `importDeps`, inyectable en los tests.

### Importación

- **Sincrónico** (default): se pueden seleccionar varios archivos; el navegador los importa uno por uno y parte cada archivo (`{quotes: [...]}` o un array) en lotes de 500, enviados **en serie** a `POST /quotes/batch`. Cada archivo tiene su progreso y resultado. `201` cuenta como importado; `422` marca el lote como rechazado y sigue con el siguiente. Un error de red o timeout (60 s) **pausa** la importación: el resultado es desconocido, nada se reintenta solo y "Reanudar" avisa que puede duplicar (ADR-09).
- **Con cola**: se suben los archivos seleccionados a `POST /imports` (`202`) de forma secuencial y se escucha cada canal público `imports.{id}` con Echo (`.ImportBatchProcessed`, `.ImportCompleted`; con punto porque el back usa `broadcastAs`). Si el socket pasa 5 s sin eventos, se consulta `GET /imports/{id}` cada 5 s hasta un estado final.
- **Modal de errores**: agrupa los errores del `422` por presupuesto (`quotes.{n}`) y muestra cada ruta exacta (`budget.items.{i}.{campo}`, `rules.{i}.{campo}`, `exchange_rates.{par}`). Por cada campo resalta el valor actual y deja escribir el nuevo (como en Paper); también se puede editar el JSON completo y previsualizarlo (JSON y renglones del ticket del evento). "Reintentar lote" reenvía el lote completo corregido a `POST /quotes/batch` (el lote es atómico).
- **Importaciones repetibles** (WEB-08): al terminar (completa, con lotes rechazados o pausada), "Importar otro archivo" vuelve a la carga; entrar a `/import` hace lo mismo salvo que haya una importación en curso. El estado es `idle → running → done | failed` y `reset()` sale del canal de Echo y corta el polling.
- El modo se elige en el panel flotante (botón abajo a la derecha) y se guarda en `localStorage` (`mottor.settings`).

### Ticket

`shared/ticket/lines.ts` sigue el pseudocódigo del [enunciado](docs/enunciado.html) y cuenta **code points** (`Array.from`), no unidades UTF-16 (ADR-04). Pasa los 17 casos de `ticket-cases.json`. Los fixtures los mantiene el back (`mottor-ai-back/tests/Fixtures/`); `src/test/fixtures.test.ts` verifica que las copias del front sean idénticas byte a byte (se saltea si el back no está al lado; `BACK_PATH` cambia la ruta).

## Cobertura

`npm run test:coverage -- --maxWorkers=1` al 2026-10-28, con Node 20.20: 112 tests OK en 21 archivos:

| Statements | Branches | Functions | Lines  |
| ---------- | -------- | --------- | ------ |
| 96,97%     | 90,26%   | 96,23%    | 97,97% |

Hay tests de stores (listado, detalle, importación sincrónica y con cola), cliente HTTP con MSW, `lines` contra las fixtures, mapeo de errores `422`, suscripción de Echo (mockeada), y de componentes (listado, detalle, importación, panel de configuración y modal de errores), con `vitest-axe` en cada pantalla y estado.

## Git flow

```text
staging ──► feat/<scope>-<descripcion> ──PR──► staging ──PR (release)──► main
```

- Las ramas salen de `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
- PR a `staging` con CI verde y review. Para liberar, PR de `staging` a `main`. Sin commits directos a `staging` ni a `main`.
- [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope opcional>): <descripción en imperativo>`.
- Cada PR completa [`.github/pull_request_template.md`](.github/pull_request_template.md) con `Spec: 001-quotes-mvp` y `Tasks: FT-xx`. Al mergear, se marcan las tareas `[x]` en mottor-ai-specs.

## Versionado y releases

Las versiones siguen [SemVer](https://semver.org/) (`vX.Y.Z`) y se calculan solas a partir de los commits en [Conventional Commits](https://www.conventionalcommits.org/) que están en `staging` y todavía no en `main`:

| Commits pendientes                                   | Bump                             |
| ---------------------------------------------------- | -------------------------------- |
| `tipo!:` o un footer `BREAKING CHANGE:`              | major (minor mientras sea `0.x`) |
| `feat`                                               | minor                            |
| `fix`, `perf`, `refactor`, `revert`                  | patch                            |
| solo `docs`, `chore`, `test`, `ci`, `style`, `build` | patch                            |

Se parte del último tag `vX.Y.Z` alcanzable desde `main` (o de `v0.0.0` si no hay ninguno). Mientras la versión sea `0.x`, un cambio incompatible sube el minor en lugar del major.

Cómo funciona ([`.github/workflows/release.yml`](.github/workflows/release.yml)):

1. Cada push a `staging` corre [`scripts/release-pr.sh`](scripts/release-pr.sh), que abre o actualiza un único PR `staging` → `main` con la label `release`, el título `release: vX.Y.Z` y las notas agrupadas (¿Qué hay de nuevo?, Correcciones, Otros). Si `staging` no tiene cambios respecto de `main`, cierra ese PR.
2. Al mergear el PR de release, [`scripts/release-tag.sh`](scripts/release-tag.sh) crea el tag anotado `vX.Y.Z` sobre el merge commit de `main` y la GitHub Release con las mismas notas. Después adelanta `staging` hasta `main` si es fast-forward; si no, lo deja como está y avisa en el log.

El PR de release se mergea con **merge commit**, no con squash ni rebase: así los commits de `staging` quedan en `main` y el historial no se rompe.

Para verlo a mano sin tocar GitHub (solo hace falta `git` y `gh` autenticado):

```bash
./scripts/release-pr.sh --dry-run                 # versión y notas que calcularía
./scripts/release-pr.sh                           # crea o actualiza el PR de release
./scripts/release-tag.sh <número-de-PR> --dry-run # qué tag y release crearía
```
