import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeslogarButton } from './DeslogarButton.tsx';

// Cenários Gherkin: docs/requisitos.md, Feature "Autenticação". Aqui só o
// fluxo de confirmação; a volta para a tela de login (token removido) é
// testada em App.test.tsx.
describe('DeslogarButton', () => {
  it('Cenário: Deslogar pede confirmação', async () => {
    const onDeslogar = vi.fn();
    render(<DeslogarButton onDeslogar={onDeslogar} />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onDeslogar).not.toHaveBeenCalled();
  });

  it('Cenário: Deslogar um usuário autenticado — confirmar aciona onDeslogar', async () => {
    const onDeslogar = vi.fn();
    render(<DeslogarButton onDeslogar={onDeslogar} />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onDeslogar).toHaveBeenCalledTimes(1);
  });

  it('Cenário: Cancelar o deslogar mantém a sessão', async () => {
    const onDeslogar = vi.fn();
    render(<DeslogarButton onDeslogar={onDeslogar} />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onDeslogar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
