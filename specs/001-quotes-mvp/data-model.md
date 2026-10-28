# Data Model: Quotes MVP (frontend)

El front no tiene persistencia propia. Este documento define los **view models** y su mapeo desde los tipos generados de `contracts/openapi.yaml` (`components['schemas'][...]`). Los props de componentes siguen design.md §5.2, ajustados al contrato.

## Tipos base

```ts
type CurrencyCode = string;                 // ISO 4217 (components.schemas.CurrencyCode)
type Decimal = string;                      // "1234.50", nunca number
type Money = { amount: Decimal; currency: CurrencyCode };
```

Cambio respecto de design.md §5.2: `Money.amount` es solo `string` (se descarta `number` y minor units, Q3 resuelta en el borrador del contrato).

## View models

| View model | Origen (schema) | Mapeo / notas |
|---|---|---|
| `QuoteRow` | `QuoteSummary` | `subtotal`/`total` → `Money` con `displayCurrency`; `itemsCount` (propuesto en el contrato) |
| `QuoteDetailVM` | `QuoteDetail` | más `conversionNote` = "Convertido a {displayCurrency} · tasa {exchangeRate} ({exchangeRateDate})" si `originalCurrency ≠ displayCurrency` |
| `AppliedRuleVM` | `AppliedRule` | `type` del contrato (`percentage_discount`, ...) → variante visual: discount (success, `TrendingDown`), surcharge/fee/tax (warning, `TrendingUp`), cero (muted, `Minus`). Reemplaza el enum `percentage\|fixed\|cap\|other` de design.md §5.2 [NEEDS CLARIFICATION: ¿hay reglas tipo "cap" (tope)? (Q10)] |
| `RuleBreakdownCheck` | derivado | `ok = sum(deltas) + subtotal === total` con BigInt; si no cuadra → warning visible (QA) |
| `ClientOption` | `ClientRef` | `{ value: id, label: name }` |
| `ImportProgressVM` | `Import` | `percent = processedRows/totalRows` (entero, solo display); `currentBatch = processedBatches + 1` (propuesto); `isTerminal = status ∈ {completed, completed_with_errors, failed, cancelled}` |
| `ImportReportVM` | `Import` + `ImportRowError[]` | `status` UI: completed → success · completed_with_errors → partial · failed · cancelled |
| `TicketDraft` | `Ticket` | `{ header, footer, isDirty }`; `rendered` canónico tras guardar |

## Estado de UI (URL)

| Param | Pantalla | Default |
|---|---|---|
| `page` | /quotes | 1 |
| `perPage` | /quotes | 25 |
| `clientId` | /quotes | — |
| `currency` | global | `USD` |

## Validaciones client-side
- Import: extensión `.json` y tamaño ≤ 20 MB antes de subir. [NEEDS CLARIFICATION: CSV (design.md muestra `.json, .csv`; el contrato solo acepta JSON) (Q7)]
- Ticket: `header`/`footer` ≤ 500 caracteres, con contador (`aria-describedby`).
