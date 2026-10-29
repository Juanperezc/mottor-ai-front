import { http, HttpResponse } from 'msw';
import detail from './official-case.expected.json';
import listRow from './official-case.list-usd.expected.json';
import type { BatchCreated, ImportStatus, QuoteDetail, QuoteList } from '../api/client';

export const API = import.meta.env.VITE_API_URL ?? 'http://localhost';

const quoteDetail = detail as QuoteDetail;

/** One row per currency, built from the official-case fixtures (USD comes straight from the fixture). */
function row(currency: string): QuoteList['data'][number] {
  const total =
    currency === 'USD' ? listRow.total : currency === 'ARS' ? listRow.original_total : null;
  return { ...listRow, currency, total };
}

export const handlers = [
  http.get(`${API}/quotes`, ({ request }) => {
    const url = new URL(request.url);
    const client = (url.searchParams.get('client') ?? '').toLowerCase();
    const currency = url.searchParams.get('currency') ?? 'ARS';
    const perPage = Number(url.searchParams.get('per_page') ?? 50);
    const data = listRow.client.toLowerCase().includes(client) ? [row(currency)] : [];
    const body: QuoteList = {
      data,
      meta: {
        page: Number(url.searchParams.get('page') ?? 1),
        per_page: perPage,
        total: data.length,
        last_page: 1,
      },
    };
    return HttpResponse.json(body);
  }),

  http.get(`${API}/quotes/:id`, ({ params }) =>
    String(params.id) === String(quoteDetail.id)
      ? HttpResponse.json(quoteDetail)
      : HttpResponse.json({ message: 'Quote not found.' }, { status: 404 }),
  ),

  http.post(`${API}/quotes/batch`, async ({ request }) => {
    const { quotes } = (await request.json()) as { quotes: { budget: { id: string } }[] };
    const body: BatchCreated = {
      imported: quotes.length,
      quotes: quotes.map((q, i) => ({
        id: i + 1,
        budget_id: q.budget.id,
        currency: 'ARS',
        total: 0,
      })),
    };
    return HttpResponse.json(body, { status: 201 });
  }),

  http.post(`${API}/imports`, () => {
    const body: ImportStatus = {
      id: 1,
      status: 'queued',
      total_batches: 1,
      processed_batches: 0,
      imported: 0,
      failed_batches: 0,
      duration_ms: null,
    };
    return HttpResponse.json(body, { status: 202 });
  }),

  http.get(`${API}/imports/:id`, ({ params }) => {
    const body: ImportStatus = {
      id: Number(params.id),
      status: 'completed',
      total_batches: 1,
      processed_batches: 1,
      imported: 1,
      failed_batches: 0,
      duration_ms: 1200,
    };
    return HttpResponse.json(body);
  }),
];
