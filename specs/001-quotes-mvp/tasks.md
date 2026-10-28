---
description: "Tasks frontend para 001-quotes-mvp (mottor-ai-front)"
---

# Tasks: Quotes MVP (frontend)

**Input**: Design documents from `/specs/001-quotes-mvp/`

**Prerequisites**: plan.md, spec.md (**Approved**: hoy está en Draft, así que estas tareas NO arrancan), research.md, data-model.md, contracts/openapi.yaml, `docs/design.md` aprobado

**Tests**: obligatorios (constitución V y VII). Cada componente de dominio y cada página tiene tests de comportamiento y axe.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable · **[Story]**: US1 Dashboard · US2 Import · US3 Detail/Ticket · `(deps: ...)`

## Phase 1: Setup

- [ ] T001 Crear el proyecto Vite + React + TypeScript strict; alias `@/` (deps: —)
- [ ] T002 [P] Tailwind + shadcn/ui init + tokens de design.md §4 en `src/app/globals.css` (light y dark) (deps: T001)
- [ ] T003 [P] ESLint (+ jsx-a11y), Prettier y script `typecheck` (deps: T001)
- [ ] T004 [P] Vitest + Testing Library + user-event + vitest-axe + MSW en `src/test/setup.ts` (deps: T001)
- [ ] T005 [P] CI: lint, typecheck y test (deps: T003, T004)
- [ ] T006 Copiar `contracts/openapi.yaml`, script `gen:api` (openapi-typescript) y generar `src/api/schema.d.ts` (deps: T001)

## Phase 2: Foundational (bloquea todas las US)

- [ ] T010 [P] Tests de `formatMoney` y `sumDecimalStrings` (BigInt, sin float, signo U+2212, `exceptZero`) (deps: T004)
- [ ] T011 Implementar `src/shared/money/` (deps: T010)
- [ ] T012 `ApiClient` (openapi-fetch) + `ApiClientProvider` (DIP) + mapeo de errores 422 y `{message}` (deps: T006)
- [ ] T013 [P] Handlers MSW tipados + fixtures por endpoint en `src/test/msw/` (deps: T006, T004)
- [ ] T014 [P] Instalar los componentes shadcn de design.md §5.1 (deps: T002)
- [ ] T015 `AppShell` (skip link, sidebar, topbar, `CurrencySelect`, tema) + Router (`/quotes`, `/import`, `/quotes/:id`) + test de axe (deps: T012, T014)
- [ ] T016 [P] Componentes compartidos `PageHeader`, `EmptyState`, `ErrorState`, `TablePagination`, `MoneyCell` + tests (deps: T011, T014)
- [ ] T017 [P] `useUrlState` (page, perPage, clientId, currency) + tests (deps: T001)

**Checkpoint**: shell navegable con mocks.

## Phase 3: User Story 1: Quotes Dashboard (P1) 🎯 MVP

- [ ] T020 [P] [US1] Hooks `useQuotes`, `useClients` (debounce 250 ms) y `useCurrencies` + tests con MSW (deps: T012, T013, T017)
- [ ] T021 [P] [US1] `EventDescriptionCell` (pre-line, clamp, "Ver más" con `aria-expanded`) + tests (deps: T014)
- [ ] T022 [P] [US1] `ClientFilter` (Combobox server-side, label visible, opción "Todos") + tests de teclado (deps: T014, T020)
- [ ] T023 [US1] `QuoteTable` (desktop/tablet) + `QuoteCard` (mobile), link accesible en el código, caption sr-only (deps: T016, T021)
- [ ] T024 [US1] `QuotesPage`: loading (skeleton), refetch (opacity-60 + aria-busy), empty, sin resultados, error, página fuera de rango y conteo con aria-live (deps: T020, T022, T023)
- [ ] T025 [US1] Tests de integración de `QuotesPage` (paginar, filtrar, cambiar moneda, axe por estado) (deps: T024)

**Checkpoint**: el dashboard funciona contra MSW y contra el back real.

## Phase 4: User Story 2: Dataset Import (P2)

- [ ] T030 [P] [US2] Hooks `useCreateImport`, `useImportStatus` (refetchInterval 1 s hasta estado terminal), `useImportErrors` y `useCancelImport` + tests (deps: T012, T013)
- [ ] T031 [P] [US2] `ImportDropzone` (input file real sr-only, validación .json/20 MB, error con `role="alert"`) + tests (deps: T014)
- [ ] T032 [P] [US2] `ImportStepper` y `BatchProgress` (Progress con aria-valuenow, anuncio por batch o cada 25%, `BatchStatusStrip`) + tests (deps: T014)
- [ ] T033 [P] [US2] `ImportReport` (Alert por estado, 4 StatCards, `ImportErrorTable` paginada, "Descargar errores CSV" generado en el cliente) + tests (deps: T016)
- [ ] T034 [US2] `ImportPage`: flujo idle → subiendo → procesando → resultado, cancelar y foco al reporte al terminar (deps: T030 a T033)
- [ ] T035 [US2] Tests de integración + axe en todos los estados (éxito, parcial, fallido, cancelado) (deps: T034)

## Phase 5: User Story 3: Quote Detail y Ticket (P3)

- [ ] T040 [P] [US3] Hooks `useQuote`, `useTicket` y `useUpdateTicket` + tests (deps: T012, T013)
- [ ] T041 [P] [US3] `QuoteSummary` (3 StatCards; Ajustes = Σ deltas) + `QuoteItemsTable` + tests (deps: T016)
- [ ] T042 [P] [US3] `RuleDeltaBadge` + `RuleBreakdownList` (orden del backend, base/delta/acumulado, sin reglas, warning si Σ ≠ total, tabla en lg y lista en sm) + tests (deps: T011, T014)
- [ ] T043 [P] [US3] `TicketPreview` (Geist Mono, 40ch) + `TicketEditor` (Tabs/split, debounce 150 ms, dirty, guardar/descartar, aviso al salir, contador) + tests (deps: T014)
- [ ] T044 [US3] `QuoteDetailPage`: breadcrumb, "Volver" con filtros preservados, nota de conversión, 404, error y layout responsive (deps: T040 a T043)
- [ ] T045 [US3] Tests de integración + axe (detalle, sin reglas, 404, guardar ticket ok/error) (deps: T044)

## Phase 6: Polish & Cross-Cutting

- [ ] T050 [P] Verificar que `openapi.yaml` sea idéntico al del back (checksum en CI) y que `gen:api` no deje diff
- [ ] T051 [P] Reduced motion, zoom 200% y 320 px: checklist de design.md §6/§7
- [ ] T052 [P] e2e Playwright + @axe-core/playwright de los 3 flujos (opcional) (deps: T025, T035, T045)
- [ ] T053 UI/UX Review con MAI - UI/UX Designer y fixes (deps: T025, T035, T045)
- [ ] T054 [P] README del repo (setup, mocks, scripts)

## Dependencies & Execution Order

- Setup → Foundational → US1 → (US2 ∥ US3) → Polish. US2 y US3 son independientes entre sí.
- Gracias a MSW (T013), el front no depende de que el back esté implementado, solo del contrato.
- Paralelizables típicos: T020/T021/T022; T030 a T033; T040 a T043.
