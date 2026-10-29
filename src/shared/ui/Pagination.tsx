import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatInteger } from '../money/formatMoney';
import { InfoTooltip } from './InfoTooltip';

/** Page numbers to show: first, last and the current one with its neighbours; null = gap. */
export function pageWindow(page: number, last: number): (number | null)[] {
  const pages = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last));
  if (page <= 2) [2, 3].filter((p) => p <= last).forEach((p) => pages.add(p));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - (sorted[i - 1] ?? p) > 1 ? [null, p] : [p]));
}

interface PaginationProps {
  page: number;
  lastPage: number;
  perPage: number;
  onChange: (page: number) => void;
}

const cell = 'inline-flex size-7 items-center justify-center rounded-sm border text-sm font-mono';

export function Pagination({ page, lastPage, perPage, onChange }: PaginationProps) {
  return (
    <nav
      aria-label="Paginación"
      className="px-page flex flex-wrap items-center justify-between gap-3 border-t border-border py-3.5"
    >
      <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
        Página {formatInteger(page)} de {formatInteger(lastPage)} · {perPage} por página
        <InfoTooltip term="pagination" />
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            className={`${cell} border-border bg-bg-subtle disabled:opacity-40`}
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
        </li>
        {pageWindow(page, lastPage).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-ink-muted">
              ···
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`${cell} min-w-7 px-1 ${p === page ? 'border-ink bg-ink text-white' : 'border-border bg-surface'}`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Página ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={`${cell} border-border bg-surface disabled:opacity-40`}
            onClick={() => onChange(page + 1)}
            disabled={page >= lastPage}
            aria-label="Página siguiente"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
