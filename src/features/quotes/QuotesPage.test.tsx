import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import { expectNoA11yViolations, renderRoute } from '../../test/utils';

const nbsp = (s: string | null) => s?.replace(/\s/g, ' ');

describe('QuotesPage (FT-15, FT-16)', () => {
  it('lists quotes with event lines and total, and has no a11y violations', async () => {
    const { container } = renderRoute('/quotes');
    const link = await screen.findByRole('link', { name: /Agencia Norte/ });
    expect(link).toHaveAttribute('href', '/quotes/17');
    const row = link.closest('tr') as HTMLElement;
    expect(within(row).getByText('Lanzamiento de producto ·')).toBeInTheDocument();
    expect(nbsp(within(row).getByText(/4\.722\.388,00/).textContent)).toBe('$ 4.722.388,00');
    expect(screen.getByText('1 presupuestos en total')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('converts to USD and shows the original total (scenario 6)', async () => {
    const { router } = renderRoute('/quotes?client=norte&page=3');
    await screen.findByRole('link', { name: /Agencia Norte/ });
    await userEvent.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    expect(await screen.findByText(/3\.256,82/)).toBeInTheDocument();
    expect(screen.getByText('ARS 4.722.388,00')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total (USD)' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?client=norte&currency=USD&page=1');
  });

  it('shows "Sin tasa" when the total is null (FX-04)', async () => {
    renderRoute('/quotes?currency=EUR');
    expect(await screen.findByText('Sin tasa')).toBeInTheDocument();
    expect(screen.getByText(/No hay tasa ARS_EUR/)).toBeInTheDocument();
    expect(screen.getByText(/1 de 1 presupuestos sin tasa de cambio/)).toBeInTheDocument();
  });

  it('debounces the client filter and resets to page 1', async () => {
    const seen: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/quotes?')) seen.push(new URL(request.url).search);
    });
    const { router } = renderRoute('/quotes?page=2');
    await screen.findByRole('link', { name: /Agencia Norte/ });
    await userEvent.type(screen.getByLabelText('Cliente'), 'zz');
    expect(await screen.findByText('Sin resultados para "zz"')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?client=zz&currency=ARS&page=1');
    // one request for the page load and one for the debounced "zz", none for "z"
    expect(seen.filter((s) => s.includes('client='))).toEqual([
      '?currency=ARS&page=1&per_page=50&client=zz',
    ]);
    server.events.removeAllListeners();

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtro' }));
    await screen.findByRole('link', { name: /Agencia Norte/ });
    expect(screen.getByLabelText('Cliente')).toHaveValue('');
  });

  it('shows the empty state without filter', async () => {
    server.use(
      http.get(`${API}/quotes`, () =>
        HttpResponse.json({ data: [], meta: { page: 1, per_page: 50, total: 0, last_page: 1 } }),
      ),
    );
    const { container, router } = renderRoute('/quotes');
    expect(await screen.findByText('Todavía no hay presupuestos')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Importar JSON/ })[1] as HTMLElement,
    );
    expect(router.state.location.pathname).toBe('/import');
  });

  it('shows the loading skeleton, then the error state with retry', async () => {
    server.use(http.get(`${API}/quotes`, () => HttpResponse.error(), { once: true }));
    const { container } = renderRoute('/quotes');
    expect(screen.getByLabelText('Cargando presupuestos')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los presupuestos',
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('link', { name: /Agencia Norte/ })).toBeInTheDocument();
  });

  it('paginates with the meta from the API', async () => {
    server.use(
      http.get(`${API}/quotes`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json({
          data: [
            {
              id: page,
              budget_id: `B-${page}`,
              client: `Cliente ${page}`,
              event: 'e',
              event_lines: ['e'],
              original_currency: 'ARS',
              original_total: 1,
              currency: 'ARS',
              total: 1,
            },
          ],
          meta: { page, per_page: 50, total: 9812, last_page: 197 },
        });
      }),
    );
    renderRoute('/quotes');
    await screen.findByText('Cliente 1');
    expect(screen.getByText('Página 1 de 197 · 50 por página')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Página 197' }));
    expect(await screen.findByText('Cliente 197')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    await waitFor(() => expect(screen.getByText('Cliente 196')).toBeInTheDocument());
  });
});

describe('QuotesPage mobile (Paper 03 · Listado — Mobile)', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 639px)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders one card per quote instead of the table', async () => {
    const { container } = renderRoute('/quotes?currency=EUR');
    const cards = await screen.findByRole('list', { name: 'Presupuestos' });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(within(cards).getByRole('link', { name: /Agencia Norte/ })).toHaveAttribute(
      'href',
      '/quotes/17',
    );
    expect(within(cards).getByText('Sin tasa de conversión')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
