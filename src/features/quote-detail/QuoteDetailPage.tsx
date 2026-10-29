import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { FileQuestion } from 'lucide-react';
import type { QuoteDetail } from '../../api/client';
import { isKnownRuleType } from '../../content/glossary';
import { formatCodeAmount, formatMoney, formatSigned } from '../../shared/money/formatMoney';
import { lines } from '../../shared/ticket/lines';
import { buildTicket, type TicketTexts } from '../../shared/ticket/printedTicket';
import { Hint, InfoTooltip } from '../../shared/ui/InfoTooltip';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Switch } from '../../shared/ui/switch';
import { TableScroll, Th } from '../../shared/ui/Table';
import { EmptyState, ErrorState } from '../../shared/ui/states';
import { ExchangeRatesChips } from './ExchangeRatesChips';
import { conversionHint } from './exchangeRates';
import { ItemDescriptionEditor } from './ItemDescriptionEditor';
import { PrintedTicket } from './PrintedTicket';
import { useQuoteDetailStore } from './useQuoteDetailStore';

const num = 'tnum font-mono text-right';
const EVENT = 'event';

/** Local ticket texts (WEB-12): edits are previewed, never sent or saved. */
function useTicketTexts(quote: QuoteDetail) {
  const [texts, setTexts] = useState<TicketTexts>(() => ({ event: quote.event, items: {} }));
  const [editing, setEditing] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(true);
  const setText = useCallback(
    (key: string, text: string) =>
      setTexts((all) =>
        key === EVENT ? { ...all, event: text } : { ...all, items: { ...all.items, [key]: text } },
      ),
    [],
  );
  return { texts, editing, setEditing, showCount, setShowCount, setText };
}

type Editor = ReturnType<typeof useTicketTexts>;

function Lines({ rows }: { rows: string[] }) {
  return rows.map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ));
}

function ItemsTable({ quote, editor }: { quote: QuoteDetail; editor: Editor }) {
  return (
    <section aria-labelledby="items-title">
      <h2 id="items-title" className="heading-section mb-4">
        Ítems
      </h2>
      <TableScroll>
        <table className="w-full min-w-140 border-collapse text-left">
          <thead>
            <tr>
              <Th info="description">Descripción</Th>
              <Th align="right" className="w-20">
                Cant.
              </Th>
              <Th align="right" className="w-40">
                Unitario
              </Th>
              <Th info="amount" align="right" className="w-44">
                Importe ({quote.currency})
              </Th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => {
              const key = String(item.id);
              const text = editor.texts.items[item.id] ?? item.description;
              return (
                <tr key={item.id} className="border-b border-border align-top">
                  <td className="py-4 pr-4">
                    <ItemDescriptionEditor
                      label={item.category}
                      name={item.description}
                      value={text}
                      original={item.description}
                      editing={editor.editing === key}
                      showCount={editor.showCount}
                      onOpen={() => editor.setEditing(key)}
                      onClose={() => editor.setEditing(null)}
                      onChange={(value) => editor.setText(key, value)}
                    >
                      <Lines
                        rows={text === item.description ? item.description_lines : lines(text)}
                      />
                      <span className="eyebrow-sm text-ink-muted">{item.category}</span>
                    </ItemDescriptionEditor>
                  </td>
                  <td className={`${num} py-4 text-ink-secondary`}>{item.quantity}</td>
                  <td className={`${num} py-4`}>
                    {item.currency === quote.currency ? (
                      <span className="text-ink-secondary">
                        {formatCodeAmount(item.unit_price, item.currency)}
                      </span>
                    ) : (
                      <Hint title="Importe en otra moneda" text={conversionHint(item, quote)}>
                        <button
                          type="button"
                          className="text-accent underline decoration-dotted underline-offset-4"
                        >
                          {formatCodeAmount(item.unit_price, item.currency)}
                        </button>
                      </Hint>
                    )}
                  </td>
                  <td className={`${num} py-4 font-medium`}>{formatMoney(item.line_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}

const amountTone = (amount: number) =>
  amount < 0 ? 'text-success' : amount > 0 ? 'text-warning' : 'text-ink-muted';

function RuleCell({
  step,
  currency,
}: {
  step: QuoteDetail['breakdown'][number];
  currency: string;
}) {
  if (!isKnownRuleType(step.type)) {
    // Paper DS › "tipo de regla desconocido": generic label, the row keeps its columns.
    return (
      <>
        <span className="flex flex-wrap items-center gap-1.5">
          Regla no reconocida
          <span className="rounded-sm bg-bg-subtle px-1.5 py-0.5 font-mono text-micro text-ink-secondary">
            type: {step.type}
          </span>
        </span>
        <span className="eyebrow-sm text-ink-muted">tipo desconocido</span>
      </>
    );
  }
  const foreignFixedDiscount =
    step.type === 'fixed_discount' && !step.label.startsWith(`${currency} `);
  return (
    <>
      <span className="block">{step.label}</span>
      <span className="flex items-center gap-1">
        <span className="eyebrow-sm text-ink-muted">{step.type}</span>
        <InfoTooltip term={foreignFixedDiscount ? 'foreignFixedDiscount' : step.type} />
      </span>
    </>
  );
}

function BreakdownList({ quote }: { quote: QuoteDetail }) {
  const last = quote.breakdown.length;
  return (
    <section aria-labelledby="breakdown-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="breakdown-title" className="heading-section">
          Desglose paso a paso
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <InfoTooltip term="step" />
          Orden definido en el presupuesto, no por el sistema
        </p>
      </div>
      <TableScroll>
        <table className="w-full min-w-140 border-collapse text-left">
          <thead>
            <tr>
              <Th info="step" className="w-16">
                Paso
              </Th>
              <Th info="rule">Regla</Th>
              <Th info="base" align="right" className="w-36">
                Base
              </Th>
              <Th info="adjustment" align="right" className="w-32">
                Ajuste
              </Th>
              <Th info="runningTotal" align="right" className="w-36">
                Acumulado
              </Th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 text-ink-secondary">–</td>
              <td className="py-3 text-ink-secondary">Subtotal a precio de lista</td>
              <td className={`${num} text-ink-muted`}>–</td>
              <td className={`${num} text-ink-muted`}>–</td>
              <td className={`${num} font-medium`}>{formatMoney(quote.subtotal)}</td>
            </tr>
            {quote.breakdown.map((step) => (
              <tr key={step.step} className="border-b border-border">
                <td className="py-4 text-ink-secondary">{step.step}</td>
                <td className="py-4">
                  <RuleCell step={step} currency={quote.currency} />
                </td>
                <td className={`${num} text-ink-secondary`}>{formatMoney(step.base)}</td>
                <td className={`${num} font-medium ${amountTone(step.amount)}`}>
                  {formatSigned(step.amount)}
                </td>
                <td className={`${num} ${step.step === last ? 'font-semibold' : ''}`}>
                  {formatMoney(step.running_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}

function TicketPanel({ quote, editor }: { quote: QuoteDetail; editor: Editor }) {
  const switchId = useId();
  const rows = useMemo(() => buildTicket(quote, editor.texts), [quote, editor.texts]);
  return (
    <section aria-labelledby="ticket-title" className="flex flex-col gap-4">
      <div>
        <h2 id="ticket-title" className="heading-section">
          Vista previa del ticket
        </h2>
        <p className="mt-1 text-xs text-ink-secondary">
          Refleja en vivo la edición de ítems y del evento. Se calcula en el navegador, no se
          guarda.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">Ticket impreso · ancho fijo</span>
          <span className="flex items-center gap-2 font-mono text-eyebrow text-ink-muted">
            28 col
            <label htmlFor={switchId}>Conteo</label>
            <Switch
              id={switchId}
              checked={editor.showCount}
              onCheckedChange={editor.setShowCount}
            />
          </span>
        </div>
        {editor.showCount && (
          <p className="font-mono text-micro text-ink-muted">
            Los números en gris muestran caracteres usados de 28 por renglón.
          </p>
        )}
      </div>
      <PrintedTicket rows={rows} showCount={editor.showCount} />
    </section>
  );
}

function Detail({ quote }: { quote: QuoteDetail }) {
  const editor = useTicketTexts(quote);
  return (
    <>
      <PageHeader
        back
        title={
          <>
            <span className="flex items-center gap-1.5">
              {quote.client}
              <InfoTooltip term="client" />
            </span>
            <span className="flex items-center gap-1 font-mono text-xs font-normal text-ink-muted">
              {quote.budget_id}
              <InfoTooltip term="budgetId" />
            </span>
          </>
        }
        subtitle={
          <span className="flex items-start gap-1.5">
            <ItemDescriptionEditor
              label="Evento"
              name="evento"
              value={editor.texts.event}
              original={quote.event}
              editing={editor.editing === EVENT}
              showCount={editor.showCount}
              onOpen={() => editor.setEditing(EVENT)}
              onClose={() => editor.setEditing(null)}
              onChange={(value) => editor.setText(EVENT, value)}
            >
              {editor.texts.event}
            </ItemDescriptionEditor>
            {editor.editing !== EVENT && <InfoTooltip term="event" className="mt-0.5" />}
          </span>
        }
        aside={
          <dl className="flex flex-wrap items-start gap-6 sm:gap-8">
            <ExchangeRatesChips rates={quote.exchange_rates} />
            <div className="flex flex-col items-end gap-1">
              <dt className="flex items-center gap-1">
                <span className="eyebrow-sm">Subtotal</span>
                <InfoTooltip term="subtotal" />
              </dt>
              <dd className="tnum font-mono text-md text-ink-secondary">
                {formatMoney(quote.subtotal, quote.currency)}
              </dd>
            </div>
            <div className="flex flex-col items-end gap-1">
              <dt className="flex items-center gap-1">
                <span className="eyebrow-sm">Total ({quote.currency})</span>
                <InfoTooltip term="total" />
              </dt>
              <dd className="tnum font-mono text-lg font-semibold">
                {formatMoney(quote.total, quote.currency)}
              </dd>
            </div>
          </dl>
        }
      />
      <div className="grid flex-1 lg:grid-cols-detail">
        <div className="px-page flex min-w-0 flex-col gap-10 py-8">
          <ItemsTable quote={quote} editor={editor} />
          <BreakdownList quote={quote} />
        </div>
        <aside className="px-page border-border bg-bg-subtle py-8 lg:border-l">
          <TicketPanel quote={quote} editor={editor} />
        </aside>
      </div>
    </>
  );
}

export function QuoteDetailPage() {
  const id = Number(useParams().id);
  const { status, quote, fetch } = useQuoteDetailStore();

  useEffect(() => {
    if (Number.isInteger(id)) void fetch(id);
  }, [fetch, id]);

  if (status === 'not-found' || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Presupuesto no encontrado"
        description="No existe un presupuesto con ese id."
        action={
          <Link to="/quotes" className="btn-secondary">
            Volver al listado
          </Link>
        }
      />
    );
  }
  if (status === 'error') {
    return (
      <ErrorState
        title="No pudimos cargar el presupuesto"
        description="Hubo un error de conexión con el servidor. Probá de nuevo."
        action={
          <button type="button" className="btn-primary" onClick={() => void fetch(id)}>
            Reintentar
          </button>
        }
      />
    );
  }
  if (status !== 'success' || !quote) {
    return (
      <p aria-busy="true" className="px-4 py-24 text-center text-ink-secondary sm:px-8">
        Cargando presupuesto…
      </p>
    );
  }
  return <Detail key={quote.id} quote={quote} />;
}
