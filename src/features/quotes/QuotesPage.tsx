import { memo, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Briefcase, ChevronRight, Download, Search, TriangleAlert } from 'lucide-react';
import type { QuoteSummary } from '../../api/client';
import { formatInteger, formatMoney } from '../../shared/money/formatMoney';
import { Banner } from '../../shared/ui/Banner';
import { Field, Select } from '../../shared/ui/Field';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Pill } from '../../shared/ui/Pill';
import { TableScroll, Th } from '../../shared/ui/Table';
import { useMediaQuery } from '../../shared/ui/useMediaQuery';
import { EmptyState, ErrorState } from '../../shared/ui/states';
import { Pagination } from '../../shared/ui/Pagination';
import { InfoTooltip } from '../../shared/ui/InfoTooltip';
import { CURRENCIES, PER_PAGE, PER_PAGE_OPTIONS, useQuotesStore } from './useQuotesStore';

const DEBOUNCE_MS = 300;

/** Filters live in the URL (FT-15): ?client=&currency=&page= */
function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const currency = params.get('currency') ?? 'ARS';
    const perPage = Number(params.get('per_page'));
    return {
      client: params.get('client') ?? '',
      currency: (CURRENCIES as readonly string[]).includes(currency) ? currency : 'ARS',
      page: Math.max(1, Number(params.get('page')) || 1),
      per_page: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? perPage : PER_PAGE,
    };
  }, [params]);
  // Stable setter: it is passed to children and effects.
  const update = useCallback(
    (next: Partial<typeof filters>) => {
      const merged = { ...filters, page: 1, ...next };
      setParams(
        Object.fromEntries(
          Object.entries(merged)
            .filter(([key, value]) => value !== '' && !(key === 'per_page' && value === PER_PAGE))
            .map(([key, value]) => [key, String(value)]),
        ),
      );
    },
    [filters, setParams],
  );
  return [filters, update] as const;
}

function ClientFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    // URL changed from outside (e.g. "Limpiar filtro")
    setSynced(value);
    setDraft(value);
  }

  const commit = useEffectEvent(() => onChange(draft));
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(commit, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <Field
      label="Cliente"
      info="client"
      hint="No distingue mayúsculas ni acentos"
      className="w-full sm:w-65"
    >
      {({ id, hintId }) => (
        <div className="relative">
          <Search aria-hidden className="absolute top-2.5 left-3 size-4 text-ink-secondary" />
          <input
            id={id}
            type="search"
            placeholder="Buscar por cliente…"
            className="field w-full pl-8.5"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-describedby={hintId}
          />
        </div>
      )}
    </Field>
  );
}

/** Converted total; `card` is the mobile layout of Paper's "03 · Listado — Mobile". */
function TotalCell({ quote, card = false }: { quote: QuoteSummary; card?: boolean }) {
  if (quote.total === null) {
    // FX-04: no rate to convert; the glossary promises the original total instead.
    return (
      <span className={`flex flex-col gap-1 ${card ? 'items-start' : 'items-end'}`}>
        <span className="inline-flex items-center gap-1.5">
          <Pill tone="warning" icon={TriangleAlert}>
            {card ? 'Sin tasa de conversión' : 'Sin tasa'}
          </Pill>
          <InfoTooltip term="noRate" />
        </span>
        <span className="tnum font-mono text-eyebrow text-ink-muted">
          {quote.original_currency} {formatMoney(quote.original_total)}
        </span>
        <span className="text-micro text-ink-muted">
          No hay tasa {quote.original_currency}_{quote.currency} para este presupuesto
        </span>
      </span>
    );
  }
  return (
    <span className={`flex flex-col gap-0.5 ${card ? 'items-start' : 'items-end'}`}>
      <span className={`tnum font-mono ${card ? 'text-md font-semibold' : ''}`}>
        {formatMoney(quote.total, quote.currency)}
      </span>
      {quote.original_currency !== quote.currency && (
        <span className="tnum font-mono text-eyebrow text-ink-muted">
          {quote.original_currency} {formatMoney(quote.original_total)}
        </span>
      )}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando presupuestos"
      className="px-page flex flex-col gap-5 py-6"
    >
      {[160, 120, 140, 150].map((width, i) => (
        <div key={i} className="flex animate-pulse items-center gap-6">
          <div className="h-3 rounded-sm bg-border" style={{ width }} />
          <div className="h-3 flex-1 rounded-sm bg-border" />
          <div className="h-3 w-24 rounded-sm bg-border" />
        </div>
      ))}
    </div>
  );
}

// memo: keeps the 50 cards still while the filters above re-render.
const QuoteCards = memo(function QuoteCards({ quotes }: { quotes: QuoteSummary[] }) {
  return (
    <ul aria-label="Presupuestos">
      {quotes.map((quote) => (
        <li
          key={quote.id}
          className="px-page relative border-b border-border py-4 hover:bg-bg-subtle"
        >
          <div className="flex items-start justify-between gap-3">
            <Link
              to={`/quotes/${quote.id}`}
              className="flex flex-col gap-0.5 after:absolute after:inset-0"
            >
              <span className="text-base font-semibold">{quote.client}</span>
              <span className="font-mono text-eyebrow text-ink-muted">{quote.budget_id}</span>
            </Link>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-secondary" />
          </div>
          <p className="mt-2 text-sm text-ink-secondary">
            {quote.event_lines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="mt-2">
            <TotalCell quote={quote} card />
          </div>
        </li>
      ))}
    </ul>
  );
});

// memo: keeps the 50 rows still while the filters above re-render.
const QuotesTable = memo(function QuotesTable({
  quotes,
  currency,
}: {
  quotes: QuoteSummary[];
  currency: string;
}) {
  return (
    <TableScroll>
      <table className="w-full min-w-150 border-collapse text-left">
        <thead>
          <tr>
            <Th info="client" className="w-70 pt-2.5 pl-4 sm:pl-8">
              Cliente
            </Th>
            <Th info="event" className="pt-2.5">
              Evento
            </Th>
            <Th info="total" align="right" className="w-50 pt-2.5">
              Total ({currency})
            </Th>
            <Th className="w-12 pr-4 sm:pr-8">
              <span className="sr-only">Abrir</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id} className="relative border-b border-border hover:bg-bg-subtle">
              <td className="py-3.5 pl-4 align-top sm:pl-8">
                <Link
                  to={`/quotes/${quote.id}`}
                  className="flex flex-col gap-0.5 after:absolute after:inset-0"
                >
                  <span className="font-medium">{quote.client}</span>
                  <span className="font-mono text-eyebrow text-ink-muted">{quote.budget_id}</span>
                </Link>
              </td>
              <td className="py-3.5 align-top">
                {quote.event_lines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </td>
              <td className="py-3.5 text-right align-top">
                <TotalCell quote={quote} />
              </td>
              <td className="py-3.5 pr-4 align-top sm:pr-8">
                <ChevronRight aria-hidden className="ml-auto size-4 text-ink-secondary" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
});

export function QuotesPage() {
  const [filters, setFilters] = useFilters();
  const { status, list, fetch } = useQuotesStore();
  const navigate = useNavigate();
  const mobile = useMediaQuery('(max-width: 639px)');
  const { client, currency, page, per_page } = filters;

  useEffect(() => {
    void fetch({ client, currency, page, per_page });
  }, [fetch, client, currency, page, per_page]);

  const quotes = useMemo(() => list?.data ?? [], [list]);
  const missingRates = useMemo(
    () => quotes.filter((quote) => quote.total === null).length,
    [quotes],
  );
  const setClient = useCallback((value: string) => setFilters({ client: value }), [setFilters]);
  const setPage = useCallback((next: number) => setFilters({ page: next }), [setFilters]);
  const importButton = (
    <button type="button" className="btn-primary" onClick={() => navigate('/import')}>
      <Download aria-hidden className="size-4" />
      <span className="sr-only sm:not-sr-only">Importar JSON</span>
    </button>
  );

  return (
    <>
      <PageHeader title="Presupuestos" aside={importButton} />

      <section
        aria-label="Filtros"
        className="px-page flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg-subtle py-5"
      >
        <div className="flex flex-wrap items-start gap-4">
          <ClientFilter value={client} onChange={setClient} />
          <Field label="Moneda" info="currency">
            {({ id }) => (
              <Select
                id={id}
                className="w-27.5"
                value={currency}
                onChange={(event) => setFilters({ currency: event.target.value })}
              >
                {CURRENCIES.map((code) => (
                  <option key={code}>{code}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Por página" info="perPage">
            {({ id }) => (
              <Select
                id={id}
                className="w-22.5 font-mono"
                value={per_page}
                onChange={(event) => setFilters({ per_page: Number(event.target.value) })}
              >
                {PER_PAGE_OPTIONS.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {list && (
          <p className="text-xs text-ink-secondary" aria-live="polite">
            {formatInteger(list.meta.total)} presupuestos en total
          </p>
        )}
      </section>

      {status === 'success' && missingRates > 0 && (
        <Banner tone="warning" live={false}>
          {missingRates} de {quotes.length} presupuestos sin tasa de cambio en esta página
        </Banner>
      )}

      {(status === 'loading' || status === 'idle') && <SkeletonRows />}

      {status === 'error' && (
        <ErrorState
          title="No pudimos cargar los presupuestos"
          description="Hubo un error de conexión con el servidor. Probá de nuevo."
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={() => void fetch({ client, currency, page, per_page })}
            >
              Reintentar
            </button>
          }
        />
      )}

      {status === 'success' &&
        quotes.length === 0 &&
        (client ? (
          <EmptyState
            icon={Search}
            title={`Sin resultados para "${client}"`}
            description="No encontramos presupuestos que coincidan con ese cliente."
            action={
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setFilters({ client: '' })}
              >
                Limpiar filtro
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Briefcase}
            title="Todavía no hay presupuestos"
            description="Importá un dataset.json para empezar a ver el histórico."
            action={importButton}
          />
        ))}

      {status === 'success' && list && quotes.length > 0 && (
        <>
          {mobile ? (
            <QuoteCards quotes={quotes} />
          ) : (
            <QuotesTable quotes={quotes} currency={currency} />
          )}
          <div className="mt-auto">
            <Pagination
              page={list.meta.page}
              lastPage={list.meta.last_page}
              perPage={per_page}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </>
  );
}
