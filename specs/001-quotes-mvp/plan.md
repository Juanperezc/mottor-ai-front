# Implementation Plan: Quotes MVP (frontend)

**Branch**: `001-quotes-mvp` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md) (Draft)

**Input**: Feature specification from `/specs/001-quotes-mvp/spec.md`

> Plan en borrador: depende de que la spec pase a *Approved*. Repo: `mottor-ai-front`. La fuente visual y de accesibilidad es `docs/design.md` (MAI - UI/UX Designer).

## Summary

SPA React + TypeScript con 3 pantallas (`/quotes`, `/import`, `/quotes/:id`) que consume el API definido en `contracts/openapi.yaml`. Los tipos se generan desde el contrato, el data fetching va con TanStack Query y la UI con shadcn/ui + Tailwind + Lucide usando los tokens de design.md. No recalcula montos de negocio: formatea con `Intl.NumberFormat` y verifica la consistencia del desglose (Σ deltas = total) como chequeo de QA.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), React 19 [NEEDS CLARIFICATION: ¿Vite SPA o Next.js? Se asume Vite]

**Primary Dependencies**: Vite, React Router, TanStack Query, shadcn/ui (Radix), Tailwind CSS, Lucide React, `openapi-typescript` + `openapi-fetch`, sonner

**Storage**: N/A (estado de servidor en TanStack Query y filtros en la URL)

**Testing**: Vitest + @testing-library/react + @testing-library/user-event + vitest-axe + MSW. Playwright para e2e opcional (P3)

**Target Platform**: navegadores evergreen, de 320 px a desktop

**Project Type**: web-app (SPA)

**Performance Goals**: LCP < 2,5 s en el dashboard; sin layout shift en estados de carga (skeleton con la misma grilla)

**Constraints**: WCAG 2.2 AA; sin float en montos; polling de import cada 1 s mientras `status ∈ {queued, processing}`

**Scale/Scope**: 3 pantallas, unos 20 componentes de dominio (design.md §5.2)

## Constitution Check

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. SOLID | Componentes de presentación puros; hooks por caso de uso; `ApiClient` inyectado por context (DIP); `formatMoney` único (SRP) | ✅ |
| II. Spec antes que código | spec en Draft → bloqueado | ⏳ |
| III. Contrato | Tipos generados de `openapi.yaml`; handlers MSW tipados con el contrato | ✅ |
| IV. Sin float | Los montos se manejan como string; el chequeo Σ deltas se hace con `BigInt` en unidades menores | ✅ |
| V. Tests | Vitest + Testing Library por componente y página | ✅ |
| VI. Simplicidad | Sin Redux; estado de servidor en Query y filtros en la URL | ✅ |
| VII. WCAG 2.2 AA | axe por pantalla y estado; tests de teclado; aria-live según design.md §7 | ✅ |
| VIII. Arquitectura front | `app/` → `features/` → `shared/` → `api/` | ✅ |

## Architecture

```text
app/            Router, QueryClientProvider, ApiClientProvider, ThemeProvider, AppShell
features/
  quotes/       QuotesPage (container) · useQuotes, useClients, useCurrencies · QuoteTable, QuoteCard, EventDescriptionCell, ClientFilter
  import/       ImportPage · useCreateImport, useImportStatus (polling), useImportErrors, useCancelImport · ImportStepper, ImportDropzone, BatchProgress, ImportReport
  quote-detail/ QuoteDetailPage · useQuote, useTicket, useUpdateTicket · QuoteSummary, QuoteItemsTable, RuleBreakdownList, RuleDeltaBadge, TicketEditor, TicketPreview
shared/
  ui/           componentes shadcn generados
  money/        formatMoney, sumDecimalStrings (BigInt), MoneyCell
  components/   PageHeader, EmptyState, ErrorState, TablePagination, CurrencySelect
  hooks/        useUrlState (page, perPage, clientId, currency en query string)
api/
  schema.d.ts   generado con openapi-typescript desde contracts/openapi.yaml
  client.ts     openapi-fetch + interfaz ApiClient (inyectable)
```

- **Moneda global**: `currency` vive en la URL y en un context; cambiarla invalida las queries con `currency` en su key.
- **Preview del ticket**: el preview en vivo se arma en el cliente desde `header`/`footer` y los datos de la quote (presentación, no cálculo). Al guardar, el `rendered` del backend es la versión canónica. [NEEDS CLARIFICATION: ¿el preview local tiene que coincidir carácter por carácter con `rendered`?]
- **Import**: `useImportStatus` usa `refetchInterval: 1000` mientras el estado no sea terminal; anuncia el progreso cada batch o cada 25% (aria-live) y mueve el foco al reporte al terminar.

## Project Structure

### Documentation (this feature)

```text
specs/001-quotes-mvp/
├── spec.md                 # compartida con back
├── plan.md                 # este archivo
├── research.md
├── data-model.md           # view models y mapeo desde el contrato
├── quickstart.md
├── contracts/openapi.yaml  # copia idéntica del back
└── tasks.md
```

### Source Code (repository root)

```text
src/{app,features,shared,api}/   # ver Architecture
src/test/{setup.ts,msw/handlers.ts,msw/fixtures/}
e2e/                              # Playwright (opcional)
```

**Structure Decision**: SPA única con organización por feature.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
