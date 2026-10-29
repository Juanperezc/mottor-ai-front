import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import expected from '../../mocks/official-case.expected.json';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import { expectNoA11yViolations, renderRoute } from '../../test/utils';

const text = (el: HTMLElement) => el.textContent?.replace(/\s/g, ' ');

describe('QuoteDetailPage (FT-17, FT-18)', () => {
  it('shows items, the breakdown in back order and the total (US3 scenario 1)', async () => {
    const { container } = renderRoute('/quotes/17');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Agencia NortePRE-2026-0418',
    );

    const items = within(screen.getByRole('region', { name: 'Ítems' }))
      .getAllByRole('row')
      .slice(1);
    expect(items).toHaveLength(6);
    expect(text(items[2] as HTMLElement)).toContain('USD 1.200,00');
    expect(within(items[2] as HTMLElement).getByText('Sonido')).toHaveClass('normal-case');

    const breakdown = screen.getByRole('region', { name: 'Desglose paso a paso' });
    const firstRule = within(breakdown).getAllByRole('row')[2] as HTMLElement;
    expect(within(firstRule).getByText('Promo por cantidad')).toHaveClass('normal-case');

    const steps = within(screen.getByRole('region', { name: 'Desglose paso a paso' }))
      .getAllByRole('row')
      .slice(2);
    expect(steps.map((row) => within(row).getAllByRole('cell')[3]?.textContent)).toEqual(
      expected.breakdown.map(
        (s) =>
          (s.amount > 0 ? '+' : '') +
          new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(s.amount),
      ),
    );
    expect(text(screen.getByText(/4\.722\.388,00/, { selector: 'dd' }))).toBe('$ 4.722.388,00');
    expect(text(screen.getByText(/4\.878\.500,00/, { selector: 'dd' }))).toBe('$ 4.878.500,00');
    await expectNoA11yViolations(container);
  });

  it('renders saved event and item lines as blocks without truncation', async () => {
    server.use(
      http.get(`${API}/quotes/:id`, () =>
        HttpResponse.json({
          ...expected,
          items: expected.items.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  description: 'Texto largo del ítem que ocupa dos líneas',
                  description_lines: ['Texto largo del ítem que', 'ocupa dos líneas'],
                }
              : item,
          ),
        }),
      ),
    );
    renderRoute('/quotes/17');

    const eventLine = (await screen.findAllByText('Lanzamiento de producto ·'))[0];
    if (!eventLine) throw new Error('Expected the first event line in the header.');
    expect(eventLine).toHaveClass('block');
    expect(screen.getByText('120 personas', { selector: 'span.block' })).toBeInTheDocument();
    expect(screen.queryByText('Lanzamiento de producto · 120 personas')).not.toBeInTheDocument();

    const itemRegion = screen.getByRole('region', { name: 'Ítems' });
    const firstItemLine = within(itemRegion).getAllByText('Texto largo del ítem que')[0];
    if (!firstItemLine) throw new Error('Expected the first item description line.');
    expect(firstItemLine).toHaveClass('block');
    expect(firstItemLine.nextElementSibling).toHaveTextContent('ocupa dos líneas');
    expect(firstItemLine.closest('td')?.className).not.toMatch(/truncate|whitespace-nowrap/);
  });

  it('shows the stored rates and explains foreign items with payload values only (WEB-09)', async () => {
    renderRoute('/quotes/17');
    const rates = await screen.findByRole('list', { name: 'Tasas guardadas' });
    expect(
      within(rates)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['1 USD = 1.450,00 ARS']);

    await userEvent.hover(screen.getByRole('button', { name: 'USD 1.200,00' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'USD 1.200,00 c/u · tasa 1.450,00 → ARS 1.740.000,00',
    );
  });

  it('keeps a foreign fixed-discount label and converted amount from the payload', async () => {
    server.use(
      http.get(`${API}/quotes/:id`, () =>
        HttpResponse.json({
          ...expected,
          breakdown: expected.breakdown.map((step) =>
            step.type === 'fixed_discount'
              ? { ...step, label: 'USD 50,00', amount: -72500, running_total: 3880750 }
              : step,
          ),
        }),
      ),
    );
    renderRoute('/quotes/17');
    expect(await screen.findByText('USD 50,00')).toBeInTheDocument();
    expect(screen.getByText('-72.500,00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Qué es Descuento fijo en otra moneda' }),
    ).toBeInTheDocument();
  });

  it.each([{}, [], null, undefined])(
    'says "Sin conversión" for invalid or empty rates %j',
    async (rates) => {
      server.use(
        http.get(`${API}/quotes/:id`, () => {
          const detail: Record<string, unknown> = {
            ...expected,
            items: expected.items.filter((item) => item.currency === 'ARS'),
          };
          if (rates === undefined) delete detail.exchange_rates;
          else detail.exchange_rates = rates;
          return HttpResponse.json(detail);
        }),
      );
      renderRoute('/quotes/17');
      const ratesList = await screen.findByRole('list', { name: 'Tasas guardadas' });
      expect(ratesList).toHaveTextContent('Sin conversión');
      expect(screen.queryByRole('button', { name: /USD/ })).not.toBeInTheDocument();
    },
  );

  it('edits an item inline, previews its rows and reflects it on the printed ticket (WEB-12)', async () => {
    renderRoute('/quotes/17');
    const ticket = await screen.findByRole('figure', { name: 'Ticket impreso' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar Sistema de sonido line array' }),
    );

    const editor = screen.getByRole('group', { name: 'Editando Sistema de sonido line array' });
    const box = within(editor).getByLabelText('Texto de Sistema de sonido line array');
    expect(box).toHaveFocus();
    expect(within(editor).getByText('28 caracteres · 1/4 renglones')).toBeInTheDocument();
    expect(within(editor).getByText('28/28')).toBeInTheDocument();
    expect(
      within(editor).getByText('Se calcula en el navegador, no se guarda'),
    ).toBeInTheDocument();
    expect(within(editor).queryByText(/El 4º renglón se corta/)).not.toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, 'Pantalla LED 6×3 m con operador técnico');
    expect(within(editor).getByText('39 caracteres · 2/4 renglones')).toBeInTheDocument();
    expect(ticket).toHaveTextContent('operador técnico');
    await userEvent.click(within(editor).getByRole('button', { name: 'Cerrar edición' }));
    const itemTable = screen.getByRole('region', { name: 'Ítems' });
    expect(within(itemTable).getByText('Pantalla LED 6×3 m con')).toHaveClass('block');
    expect(within(itemTable).getByText('operador técnico')).toHaveClass('block');

    await userEvent.click(
      screen.getByRole('button', { name: 'Editar Sistema de sonido line array' }),
    );
    const reopenedEditor = screen.getByRole('group', {
      name: 'Editando Sistema de sonido line array',
    });
    const reopenedBox = within(reopenedEditor).getByLabelText(
      'Texto de Sistema de sonido line array',
    );
    await userEvent.click(within(reopenedEditor).getByRole('button', { name: 'Restablecer' }));
    expect(reopenedBox).toHaveValue('Sistema de sonido line array');

    await userEvent.click(within(reopenedEditor).getByRole('button', { name: 'Cerrar edición' }));
    expect(screen.queryByRole('group', { name: /Editando/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Sistema de sonido line array' }),
    ).toHaveFocus();
  });

  it('edits the event inline and toggles the "Conteo" counters', async () => {
    renderRoute('/quotes/17');
    const ticket = await screen.findByRole('figure', { name: 'Ticket impreso' });
    expect(within(ticket).getByText('25/28')).toBeInTheDocument();
    expect(
      screen.getByText('Los números en gris muestran caracteres usados de 28 por renglón.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Conteo' }));
    expect(within(ticket).queryByText('25/28')).not.toBeInTheDocument();
    expect(screen.queryByText(/Los números en gris/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Editar evento' }));
    const box = screen.getByLabelText('Texto de evento');
    await userEvent.clear(box);
    await userEvent.type(box, 'Cena de fin de año');
    expect(ticket).toHaveTextContent('Cena de fin de año');
    expect(ticket).not.toHaveTextContent('120 personas');
  });

  it('shows an unknown rule type with a generic label, keeping the columns', async () => {
    server.use(
      http.get(`${API}/quotes/:id`, () =>
        HttpResponse.json({
          ...expected,
          breakdown: [{ ...expected.breakdown[0], type: 'loyalty_bonus', label: 'Bonus' }],
        }),
      ),
    );
    renderRoute('/quotes/17');
    const region = await screen.findByRole('region', { name: 'Desglose paso a paso' });
    expect(within(region).getByText('Regla no reconocida')).toBeInTheDocument();
    expect(within(region).getByText('type: loyalty_bonus')).toBeInTheDocument();
    expect(within(region).getByText('tipo desconocido')).toBeInTheDocument();
    expect(within(region).getAllByRole('row')[2]?.querySelectorAll('td')).toHaveLength(5);
    expect(
      within(region).getByText('Orden definido en el presupuesto, no por el sistema'),
    ).toBeInTheDocument();
  });

  it('keeps the top bar and has no settings button (WEB-10)', async () => {
    renderRoute('/quotes/17');
    await screen.findByRole('heading', { level: 1 });
    expect(within(screen.getByRole('banner')).getByText('Mottor AI')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Configuración' })).not.toBeInTheDocument();
  });

  it('shows "Presupuesto no encontrado" on 404 (US3 scenario 3)', async () => {
    const { container } = renderRoute('/quotes/999');
    expect(await screen.findByText('Presupuesto no encontrado')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('shows an error state with retry on network errors', async () => {
    server.use(http.get(`${API}/quotes/:id`, () => HttpResponse.error(), { once: true }));
    renderRoute('/quotes/17');
    expect(screen.getByText('Cargando presupuesto…')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el presupuesto');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
