import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test/utils';
import { ItemDescriptionEditor } from './ItemDescriptionEditor';

const LONG =
  'Fiesta corporativa de fin de año para toda la planta con cena de gala y show en vivo en el salón principal de Pilar Norte';

function Harness({
  initial,
  editing: startEditing = false,
}: {
  initial: string;
  editing?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(startEditing);
  return (
    <ItemDescriptionEditor
      label="catering"
      name="Menú"
      value={value}
      original={initial}
      editing={editing}
      showCount
      onOpen={() => setEditing(true)}
      onClose={() => setEditing(false)}
      onChange={setValue}
    >
      <span>{value}</span>
    </ItemDescriptionEditor>
  );
}

describe('ItemDescriptionEditor (Paper DS: normal / editando / editando-truncado)', () => {
  it('normal: shows the text and a pencil that opens the editor', async () => {
    const { container } = render(<Harness initial="Menú de tres pasos" />);
    expect(screen.getByText('Menú de tres pasos')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Editar Menú' }));
    expect(screen.getByRole('group', { name: 'Editando Menú' })).toBeInTheDocument();
  });

  it('editando: live rows with n/28, code-point counter and no truncation warning', async () => {
    const { container } = render(
      <Harness initial="Pantalla LED 6×3 m con operador técnico" editing />,
    );
    expect(screen.getByText('Pantalla LED 6×3 m con')).toBeInTheDocument();
    expect(screen.getByText('22/28')).toBeInTheDocument();
    expect(screen.getByText('16/28')).toBeInTheDocument();
    expect(screen.getByText('39 caracteres · 2/4 renglones')).toBeInTheDocument();
    expect(screen.queryByText(/El 4º renglón/)).not.toBeInTheDocument();
    expect(container.querySelector('[data-truncated]')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('counts emojis as one code point each', async () => {
    render(<Harness initial={'😀'.repeat(10)} editing />);
    expect(screen.getByText('10 caracteres · 1/4 renglones')).toBeInTheDocument();
    expect(screen.getByText('10/28')).toBeInTheDocument();
  });

  it('editando-truncado: highlights the 4th row only past 4 rows, and Restablecer goes back', async () => {
    const { container } = render(<Harness initial="Fiesta corta" editing />);
    const box = screen.getByLabelText('Texto de Menú');
    await userEvent.clear(box);
    await userEvent.click(box);
    await userEvent.paste(LONG);

    expect(screen.getByText('121 caracteres · 4/4 renglones')).toBeInTheDocument();
    expect(
      screen.getByText('El 4º renglón se corta a 27 caracteres y se agrega «…».'),
    ).toBeInTheDocument();
    const cut = container.querySelector('[data-truncated]');
    expect(cut).toHaveTextContent('en el salón principal de…');

    await userEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(box).toHaveValue('Fiesta corta');
    expect(screen.queryByText(/El 4º renglón/)).not.toBeInTheDocument();
  });

  it('exactly 4 rows is not truncated', () => {
    render(<Harness initial={'a'.repeat(28 * 4)} editing />);
    expect(screen.getByText('112 caracteres · 4/4 renglones')).toBeInTheDocument();
    expect(screen.queryByText(/El 4º renglón/)).not.toBeInTheDocument();
  });

  it('× closes and returns focus to the pencil', async () => {
    render(<Harness initial="Silla" />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar Menú' }));
    expect(screen.getByLabelText('Texto de Menú')).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar edición' }));
    expect(screen.getByRole('button', { name: 'Editar Menú' })).toHaveFocus();
  });
});
