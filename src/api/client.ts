import createClient from 'openapi-fetch';
import type { operations, paths } from './schema';

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : never;

export type QuoteList = Json<operations['quote.index']['responses'][200]>;
export type QuoteSummary = QuoteList['data'][number];
export type QuoteDetail = Json<operations['quote.show']['responses'][200]>;
export type BatchCreated = Json<operations['quote.batch']['responses'][201]>;
export type ImportStatus = Json<operations['import.show']['responses'][200]>;
export type ValidationError = Json<operations['quote.batch']['responses'][422]>;
export type QuotesQuery = operations['quote.index']['parameters']['query'];

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost',
  headers: { Accept: 'application/json' },
  // Resolve fetch per call so test interceptors (MSW) are picked up.
  fetch: (request) => globalThis.fetch(request),
});

/** Error with the HTTP status; `body` keeps the JSON error (422/404). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : `HTTP ${status}`,
    );
  }

  get errors(): Record<string, string[]> {
    const body = this.body as Partial<ValidationError> | null;
    return body?.errors ?? {};
  }
}

/** Unwraps an openapi-fetch result or throws ApiError. Network failures throw as-is (TypeError). */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(result.response.status, result.error ?? null);
  }
  return result.data;
}

/** No HTTP answer (network down, CORS, timeout): the outcome is unknown (ADR-09). */
export const failureReason = (error: unknown): 'network' | 'timeout' =>
  (error as { name?: unknown } | null)?.name === 'TimeoutError' ? 'timeout' : 'network';
