# Research (Phase 0): Quotes MVP (frontend)

## R1. Tipado desde el contrato
- **Decision**: `openapi-typescript` para generar `api/schema.d.ts` y `openapi-fetch` como cliente.
- **Rationale**: principio III (el contrato es la fuente de verdad); cero tipos escritos a mano para los DTOs.
- **Alternatives**: orval (genera hooks; acopla Query al generador) o tipos manuales (riesgo de que diverjan).

## R2. Estado de servidor y filtros
- **Decision**: TanStack Query (`placeholderData: keepPreviousData` para paginar sin skeleton) y filtros en la URL.
- **Rationale**: design.md §3.1 (mantener datos previos con opacity-60) y links compartibles; "Volver" preserva los filtros.

## R3. Montos
- **Decision**: los montos se tratan como string; `formatMoney` usa `Intl.NumberFormat` y la verificación Σ deltas usa `BigInt` en unidades menores.
- **Rationale**: principio IV. `Intl.NumberFormat.format` acepta strings decimales sin pasar por float en motores modernos.
- **Pendiente**: [NEEDS CLARIFICATION: locale es-AR vs en-US (Q5)]

## R4. Accesibilidad
- **Decision**: primitivas Radix (vía shadcn) para combobox, select, tabs y dialog; `vitest-axe` por estado; `@axe-core/playwright` en e2e.

## R5. Mocks
- **Decision**: MSW con handlers tipados por el contrato, usados en tests y en `npm run dev:mock` para avanzar sin el back.
