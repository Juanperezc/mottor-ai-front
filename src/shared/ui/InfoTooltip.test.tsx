import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { GLOSSARY, type GlossaryKey } from '../../content/glossary';
import { expectNoA11yViolations } from '../../test/utils';
import { InfoTooltip } from './InfoTooltip';

afterEach(() => vi.unstubAllGlobals());

describe('InfoTooltip (WEB-11, FT-25)', () => {
  it('has a keyboard-focusable, named trigger and opens the desktop tooltip', async () => {
    const { container } = render(<InfoTooltip term="client" />);
    const trigger = screen.getByRole('button', { name: 'Qué es Cliente' });
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(GLOSSARY.client.text);
    await expectNoA11yViolations(container);
  });

  it('opens a bottom sheet on mobile', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(max-width: 639px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })),
    );
    const { container } = render(<InfoTooltip term="noRate" />);
    await userEvent.click(screen.getByRole('button', { name: 'Qué es Sin tasa' }));
    const sheet = await screen.findByRole('dialog');
    expect(sheet).toHaveTextContent(GLOSSARY.noRate.text);
    await expectNoA11yViolations(container);
  });

  it('keeps glossary copy for every surfaced label and special amount', () => {
    const required: GlossaryKey[] = [
      'client',
      'event',
      'budgetId',
      'currency',
      'perPage',
      'pagination',
      'total',
      'noRate',
      'subtotal',
      'step',
      'rule',
      'base',
      'adjustment',
      'runningTotal',
      'description',
      'amount',
      'quantity_promo',
      'category_discount',
      'percentage_discount',
      'fixed_discount',
      'discount_cap',
      'tax',
      'exchangeRate',
      'foreignAmount',
      'foreignFixedDiscount',
      'batch',
      'progress',
      'batchErrors',
      'importMode',
    ];
    expect(Object.keys(GLOSSARY)).toEqual(expect.arrayContaining(required));
    expect(GLOSSARY.discount_cap.text).toBe(
      'El total de descuentos no puede superar este % del subtotal; si lo supera, se devuelve la diferencia. Los impuestos no cuentan.',
    );
  });
});
