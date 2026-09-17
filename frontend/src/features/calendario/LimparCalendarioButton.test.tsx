import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LimparCalendarioButton } from './LimparCalendarioButton.tsx';

// Cenários Gherkin: docs/requisitos.md, Feature "Limpar calendário". A
// remoção em si (preservando a pool) é testada no backend
// (limpar-calendario.e2e-spec.ts); aqui validamos só o fluxo de confirmação.
describe('LimparCalendarioButton', () => {
  it('Cenário: Botão "Limpar calendário" pede confirmação', async () => {
    render(<LimparCalendarioButton onLimpar={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /limpar calendário/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Cenário: Confirmar limpeza aciona onLimpar', async () => {
    const onLimpar = vi.fn();
    render(<LimparCalendarioButton onLimpar={onLimpar} />);

    await userEvent.click(screen.getByRole('button', { name: /limpar calendário/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onLimpar).toHaveBeenCalledTimes(1);
  });

  it('Cenário: Cancelar a confirmação não altera o calendário', async () => {
    const onLimpar = vi.fn();
    render(<LimparCalendarioButton onLimpar={onLimpar} />);

    await userEvent.click(screen.getByRole('button', { name: /limpar calendário/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onLimpar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
