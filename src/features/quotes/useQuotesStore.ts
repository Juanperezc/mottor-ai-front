import { create } from 'zustand';
import { api, unwrap, type QuoteList, type QuotesQuery } from '../../api/client';

export const CURRENCIES = ['ARS', 'USD', 'EUR'] as const;
export const PER_PAGE = 50;
/** `per_page` accepts 1–200 (OpenAPI); the design offers these steps. */
export const PER_PAGE_OPTIONS = [50, 100, 200] as const;

interface QuotesState {
  status: 'idle' | 'loading' | 'success' | 'error';
  list: QuoteList | null;
  fetch: (query: QuotesQuery) => Promise<void>;
}

let lastRequest = 0;

export const useQuotesStore = create<QuotesState>()((set) => ({
  status: 'idle',
  list: null,
  fetch: async ({ client, ...query }) => {
    const request = ++lastRequest;
    set({ status: 'loading' });
    try {
      const list = unwrap(
        await api.GET('/quotes', {
          params: { query: { ...query, ...(client ? { client } : {}) } },
        }),
      );
      if (request === lastRequest) set({ status: 'success', list });
    } catch {
      if (request === lastRequest) set({ status: 'error', list: null });
    }
  },
}));
