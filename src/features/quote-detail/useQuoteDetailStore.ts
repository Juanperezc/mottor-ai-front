import { create } from 'zustand';
import { ApiError, api, unwrap, type QuoteDetail } from '../../api/client';

interface QuoteDetailState {
  status: 'idle' | 'loading' | 'success' | 'not-found' | 'error';
  quote: QuoteDetail | null;
  fetch: (id: number) => Promise<void>;
}

export const useQuoteDetailStore = create<QuoteDetailState>()((set) => ({
  status: 'idle',
  quote: null,
  fetch: async (id) => {
    set({ status: 'loading', quote: null });
    try {
      const quote = unwrap(await api.GET('/quotes/{id}', { params: { path: { id } } }));
      set({ status: 'success', quote });
    } catch (error) {
      set({ status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error' });
    }
  },
}));
