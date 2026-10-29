import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import input from '../../mocks/official-case.input.json';
import { expectNoA11yViolations } from '../../test/utils';
import { ImportErrorsModal } from './ImportErrorsModal';
import type { ImportBatch } from './useImportStore';

const broken = { ...input, rules: [{ type: 'bogus' }] };
const batch: ImportBatch = {
  number: 2,
  quotes: [input, broken],
  state: {
    status: 'failed',
    errors: {
      'quotes.1.rules.0.type': ['The selected rules.0.type is invalid.'],
      batch: ['Extra info'],
    },
  },
};

describe('ImportErrorsModal (FT-14, A46)', () => {
  it('maps errors to their exact path, previews and retries the whole corrected batch', async () => {
    const onRetry = vi.fn().mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const { container } = render(
      <ImportErrorsModal batch={batch} onRetry={onRetry} onClose={onClose} />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Errores del lote 2' });
    expect(dialog).toHaveTextContent('422 · rango 501-502 · 1 de 2 presupuestos con errores');
    const card = within(dialog)
      .getByRole('heading', { name: 'quotes[1] · PRE-2026-0418' })
      .closest('article') as HTMLElement;
    expect(within(card).getByText('rules.0.type', { selector: 'code' })).toBeInTheDocument();
    expect(within(card).getByText('The selected rules.0.type is invalid.')).toBeInTheDocument();
    expect(screen.getByText('batch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await expectNoA11yViolations(container);

    const editor = within(card).getByLabelText('JSON del presupuesto');
    const fixed = { ...broken, rules: [{ type: 'tax', name: 'IVA', percent: 21 }] };
    await userEvent.clear(editor);
    await userEvent.click(editor);
    await userEvent.paste(JSON.stringify(fixed));

    await userEvent.click(within(card).getByText('Editar JSON completo y previsualizar'));
    expect(within(card).getByLabelText('JSON corregido')).toHaveTextContent('"type": "tax"');
    expect(
      within(card)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toContain('120 personas');

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar lote' }));
    expect(onRetry).toHaveBeenCalledWith(2, [input, fixed]);
    expect(onClose).toHaveBeenCalled();
  });

  it('blocks retry on invalid JSON and shows retry failures', async () => {
    const onRetry = vi
      .fn()
      .mockResolvedValue({ ok: false, message: 'El lote sigue teniendo errores.' });
    render(<ImportErrorsModal batch={batch} onRetry={onRetry} onClose={vi.fn()} />);
    const editor = screen.getByLabelText('JSON del presupuesto');
    await userEvent.type(editor, '{{');
    expect(screen.getByRole('alert')).toHaveTextContent('JSON inválido');
    expect(screen.getByRole('button', { name: 'Reintentar lote' })).toBeDisabled();

    await userEvent.clear(editor);
    await userEvent.click(editor);
    await userEvent.paste(JSON.stringify(broken));
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar lote' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El lote sigue teniendo errores.');
  });

  it('traps focus and closes with Escape', async () => {
    const onClose = vi.fn();
    render(<ImportErrorsModal batch={batch} onRetry={vi.fn()} onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const retry = screen.getByRole('button', { name: 'Reintentar lote' });
    const help = screen.getByRole('button', { name: 'Qué es Errores del lote' });
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(help).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(retry).toHaveFocus();
    await userEvent.tab();
    expect(help).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('highlights each failing field and fixes it in place (path → field)', async () => {
    const onRetry = vi.fn().mockResolvedValue({ ok: true });
    const withRate = {
      ...broken,
      exchange_rates: {},
    };
    const fieldBatch: ImportBatch = {
      number: 1,
      quotes: [withRate],
      state: {
        status: 'failed',
        message: 'The given data was invalid.',
        errors: {
          'quotes.0.rules.0.type': ['The selected rules.0.type is invalid.'],
          'quotes.0.budget.items.2.quantity': ['The quantity field is required.'],
        },
      },
    };
    render(<ImportErrorsModal batch={fieldBatch} onRetry={onRetry} onClose={vi.fn()} />);

    expect(screen.getByText(/"message": "The given data was invalid."/)).toBeInTheDocument();
    expect(screen.getByTestId('current-rules.0.type')).toHaveTextContent('type: "bogus"');
    expect(screen.getByTestId('current-rules.0.type')).toHaveClass('border-error');
    expect(screen.getByText('Regla 1 · bogus')).toBeInTheDocument();
    expect(screen.getByText('Sistema de sonido line array')).toBeInTheDocument();
    expect(screen.getByTestId('current-budget.items.2.quantity')).toHaveTextContent('quantity: 1');

    const type = screen.getByLabelText('Nuevo valor de rules.0.type');
    await userEvent.type(type, 'tax');
    expect(type).toHaveClass('border-success');
    await userEvent.type(screen.getByLabelText('Nuevo valor de budget.items.2.quantity'), '3');

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar lote' }));
    const [[, sent]] = onRetry.mock.calls as [
      [number, { rules: unknown[]; budget: { items: { quantity: number }[] } }[]],
    ];
    expect(sent[0]?.rules[0]).toEqual({ type: 'tax' });
    expect(sent[0]?.budget.items[2]?.quantity).toBe(3);
    expect(sent[0]?.budget.items[0]).toEqual(input.budget.items[0]);
  });
});
