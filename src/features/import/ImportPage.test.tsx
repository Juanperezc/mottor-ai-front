import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import input from '../../mocks/official-case.input.json';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import { useSettingsStore } from '../../shared/settings/useSettingsStore';
import { expectNoA11yViolations, renderRoute } from '../../test/utils';
import { useImportStore } from './useImportStore';

const dataset = (n: number) =>
  new File([JSON.stringify({ quotes: Array.from({ length: n }, () => input) })], 'dataset.json', {
    type: 'application/json',
  });

describe('ImportPage (FT-10, FT-11, FT-13)', () => {
  beforeEach(() => {
    useImportStore.getState().reset();
    useSettingsStore.setState({ importMode: 'sync' });
  });

  it('rejects files that are not JSON', async () => {
    renderRoute('/import');
    await userEvent.upload(screen.getByLabelText(/Elegí o arrastrá/), new File(['nope'], 'x.json'));
    expect(await screen.findByRole('alert')).toHaveTextContent('El archivo no es un JSON válido.');
  });

  it('imports in sync mode, then opens the errors modal of a failed batch and retries it', async () => {
    let call = 0;
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const { quotes } = (await request.json()) as { quotes: unknown[] };
        if (++call === 2) {
          return HttpResponse.json(
            {
              message: 'invalid',
              errors: { 'quotes.0.currency': ['The currency field format is invalid.'] },
            },
            { status: 422 },
          );
        }
        return HttpResponse.json({ imported: quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    const { container } = renderRoute('/import');
    await expectNoA11yViolations(container);
    await userEvent.upload(screen.getByLabelText(/Elegí o arrastrá/), dataset(501));

    expect(await screen.findByText('501 presupuestos · 2 lotes de 500')).toBeInTheDocument();
    expect(screen.getByText('Sincrónico')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(
      await screen.findByText(/Importación terminada con 1 lote rechazado/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'dataset.json · con errores',
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Lote 2 · 501-501')).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getAllByRole('button', { name: 'Ver errores' })[0] as HTMLElement);
    const dialog = screen.getByRole('dialog', { name: 'Errores del lote 2' });
    expect(within(dialog).getByText('currency', { selector: 'code' })).toBeInTheDocument();
    expect(within(dialog).getByText('El formato de moneda no es válido.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reintentar lote' }));

    expect(await screen.findByText(/Importación terminada: 501 de 501/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pauses on a network error and resumes manually (ADR-09)', async () => {
    server.use(http.post(`${API}/quotes/batch`, () => HttpResponse.error(), { once: true }));
    const { router } = renderRoute('/import');
    await userEvent.upload(screen.getByLabelText(/Elegí o arrastrá/), dataset(1));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));

    expect(await screen.findByText(/puede duplicar presupuestos/)).toBeInTheDocument();
    expect(screen.getByText('Sin respuesta · resultado desconocido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reanudar' }));
    expect(await screen.findByText(/Importación terminada: 1 de 1/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver presupuestos importados' }));
    expect(router.state.location.pathname).toBe('/quotes');
  });

  it('can change the file before importing', async () => {
    renderRoute('/import');
    await userEvent.upload(screen.getByLabelText(/Elegí o arrastrá/), dataset(1));
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar archivo' }));
    expect(screen.getByLabelText(/Elegí o arrastrá/)).toBeInTheDocument();
  });
});

describe('ImportPage: repeatable imports (WEB-08, FT-22)', () => {
  const named = (n: number, name: string) =>
    new File([JSON.stringify({ quotes: Array.from({ length: n }, () => input) })], name, {
      type: 'application/json',
    });
  const dropzone = () => screen.getByLabelText(/Elegí o arrastrá/);

  beforeEach(() => {
    useImportStore.getState().reset();
    useSettingsStore.setState({ importMode: 'sync' });
  });

  it('"Importar otro archivo" shows the dropzone and the second import runs with its own progress', async () => {
    const sizes: number[] = [];
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const { quotes } = (await request.json()) as { quotes: unknown[] };
        sizes.push(quotes.length);
        return HttpResponse.json({ imported: quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    renderRoute('/import');
    await userEvent.upload(dropzone(), named(2, 'first.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    expect(await screen.findByText(/Importación terminada: 2 de 2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Importar otro archivo' }));
    expect(dropzone()).toBeEnabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Importar dataset.json');

    await userEvent.upload(dropzone(), named(3, 'second.json'));
    expect(await screen.findByText('3 presupuestos · 1 lote de 500')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(await screen.findByText(/Importación terminada: 3 de 3/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('second.json importado');
    expect(screen.getByText('Lote 1 · 1-3')).toBeInTheDocument();
    expect(sizes).toEqual([2, 3]);
  });

  it('also offers a new import after a 422 fixed from the errors modal', async () => {
    let call = 0;
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const { quotes } = (await request.json()) as { quotes: unknown[] };
        if (++call === 1) {
          return HttpResponse.json(
            { message: 'invalid', errors: { 'quotes.0.currency': ['bad'] } },
            { status: 422 },
          );
        }
        return HttpResponse.json({ imported: quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    renderRoute('/import');
    await userEvent.upload(dropzone(), named(1, 'bad.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    await screen.findByText(/1 lote rechazado/);
    await userEvent.click(screen.getAllByRole('button', { name: 'Ver errores' })[0] as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar lote' }));
    expect(await screen.findByText(/Importación terminada: 1 de 1/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Importar otro archivo' }));
    await userEvent.upload(dropzone(), named(1, 'next.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    expect(await screen.findByText(/Importación terminada: 1 de 1/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('next.json importado');
  });

  it('offers a new import after a network pause (failed)', async () => {
    server.use(http.post(`${API}/quotes/batch`, () => HttpResponse.error()));
    renderRoute('/import');
    await userEvent.upload(dropzone(), named(1, 'x.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    expect(await screen.findByRole('button', { name: 'Reanudar' })).toBeInTheDocument();
    expect(useImportStore.getState().status).toBe('failed');
    await userEvent.click(screen.getByRole('button', { name: 'Importar otro archivo' }));
    expect(dropzone()).toBeInTheDocument();
  });

  it('coming back to /import after it finished shows the dropzone', async () => {
    const { router } = renderRoute('/import');
    await userEvent.upload(dropzone(), named(1, 'x.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver presupuestos importados' }),
    );
    expect(router.state.location.pathname).toBe('/quotes');

    await userEvent.click(await screen.findByRole('button', { name: /Importar JSON/ }));
    expect(router.state.location.pathname).toBe('/import');
    expect(dropzone()).toBeInTheDocument();
    expect(useImportStore.getState()).toMatchObject({
      status: 'idle',
      files: [],
    });
  });

  it('coming back to /import while running keeps showing that import', async () => {
    let release: () => void = () => {};
    server.use(
      http.post(
        `${API}/quotes/batch`,
        () =>
          new Promise<Response>((resolve) => {
            release = () =>
              resolve(HttpResponse.json({ imported: 1, quotes: [] }, { status: 201 }));
          }),
      ),
    );
    const { router } = renderRoute('/import');
    await userEvent.upload(dropzone(), named(1, 'slow.json'));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));
    await screen.findByText('Procesando…');

    await router.navigate('/quotes');
    await router.navigate('/import');
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Elegí o arrastrá/)).not.toBeInTheDocument();
    expect(screen.getAllByText('slow.json')).toHaveLength(2);
    expect(useImportStore.getState().status).toBe('running');

    release();
    expect(await screen.findByText(/Importación terminada: 1 de 1/)).toBeInTheDocument();
  });

  it('lets you pick the same file twice in a row', async () => {
    renderRoute('/import');
    const read = vi.spyOn(Blob.prototype, 'text');
    const picker = dropzone() as HTMLInputElement;

    await userEvent.upload(picker, new File(['nope'], 'same.json'));
    await screen.findByRole('alert');
    expect(picker.value).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar archivo' }));
    await userEvent.upload(dropzone(), new File(['nope'], 'same.json'));
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(2));

    const valid = named(1, 'same.json');
    await userEvent.upload(picker, valid);
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar archivo' }));
    await userEvent.upload(dropzone(), valid);
    expect(await screen.findByText('same.json')).toBeInTheDocument();
  });

  it('shows combined file progress and keeps going after invalid JSON', async () => {
    const uploaded: string[] = [];
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const { quotes } = (await request.json()) as { quotes: unknown[] };
        const first = quotes[0] as { budget: { id: string } };
        uploaded.push(first.budget.id);
        return HttpResponse.json({ imported: quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    renderRoute('/import');
    await userEvent.upload(dropzone(), [
      named(1, 'first.json'),
      new File(['not json'], 'broken.json', { type: 'application/json' }),
      named(2, 'second.json'),
    ]);
    await userEvent.click(await screen.findByRole('button', { name: 'Importar' }));

    expect(
      await screen.findByText(/Importación terminada con errores en 1 archivo/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2 archivos importados');
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(uploaded).toHaveLength(2);
    expect(screen.getAllByText('broken.json')).toHaveLength(2);
    expect(screen.getByText(/3 archivos · 3 de 3 presupuestos importados/)).toBeInTheDocument();
  });
});
