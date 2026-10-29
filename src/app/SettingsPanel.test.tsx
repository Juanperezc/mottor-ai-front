import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SETTINGS_KEY, useSettingsStore } from '../shared/settings/useSettingsStore';
import { expectNoA11yViolations } from '../test/utils';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel (FT-07, A45)', () => {
  beforeEach(() => useSettingsStore.setState({ importMode: 'sync' }));

  it('defaults to sync, persists the chosen mode in localStorage and closes with Escape', async () => {
    const { container } = render(<SettingsPanel />);
    const toggle = screen.getByRole('button', { name: 'Configuración' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Sincrónico/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Sincrónico/ })).toHaveFocus();
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getByRole('radio', { name: /Con cola/ }));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').state).toEqual({
      importMode: 'queue',
    });

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it('restores the mode after a reload', async () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ state: { importMode: 'queue' }, version: 0 }),
    );
    await useSettingsStore.persist.rehydrate();
    render(<SettingsPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Configuración' }));
    expect(screen.getByRole('radio', { name: /Con cola/ })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar configuración' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
