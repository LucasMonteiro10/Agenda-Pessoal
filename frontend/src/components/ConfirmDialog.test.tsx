import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog.tsx';

// ConfirmDialog é o componente reutilizável por trás de toda mensagem de
// confirmação do app: excluir Atividade (pool e card) e Limpar calendário
// (docs/requisitos.md, item 1 das Suposições e Features "Limpar calendário").
describe('ConfirmDialog', () => {
  it('não renderiza nada quando "open" é falso', () => {
    render(
      <ConfirmDialog open={false} mensagem="Excluir esta atividade?" onConfirmar={vi.fn()} onCancelar={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe a mensagem de confirmação quando "open" é verdadeiro', () => {
    render(
      <ConfirmDialog open={true} mensagem="Excluir esta atividade?" onConfirmar={vi.fn()} onCancelar={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Excluir esta atividade?');
  });

  it('chama onConfirmar ao clicar em "Confirmar"', async () => {
    const onConfirmar = vi.fn();
    render(
      <ConfirmDialog open={true} mensagem="Excluir esta atividade?" onConfirmar={onConfirmar} onCancelar={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it('chama onCancelar ao clicar em "Cancelar"', async () => {
    const onCancelar = vi.fn();
    render(
      <ConfirmDialog open={true} mensagem="Excluir esta atividade?" onConfirmar={vi.fn()} onCancelar={onCancelar} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
