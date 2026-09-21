import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NovaAtividadeDialog } from './NovaAtividadeDialog.tsx';

// Cenários Gherkin: docs/requisitos.md, Feature "Criar atividade a partir de
// um espaço vazio do calendário".
describe('NovaAtividadeDialog', () => {
  it('não renderiza nada quando "open" é falso', () => {
    render(<NovaAtividadeDialog open={false} nomesExistentes={[]} onCriar={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe os campos de nome e cor quando "open" é verdadeiro', () => {
    render(<NovaAtividadeDialog open={true} nomesExistentes={[]} onCriar={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da nova atividade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cor da nova atividade/i)).toBeInTheDocument();
  });

  it('chama onCriar com o nome e a cor preenchidos ao confirmar', async () => {
    const onCriar = vi.fn();
    render(<NovaAtividadeDialog open={true} nomesExistentes={['Trabalho']} onCriar={onCriar} onCancelar={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/nome da nova atividade/i), 'Yoga');
    await userEvent.click(screen.getByRole('button', { name: /criar e alocar/i }));

    expect(onCriar).toHaveBeenCalledWith('Yoga', expect.any(String));
  });

  it('rejeita nome duplicado e não chama onCriar', async () => {
    const onCriar = vi.fn();
    render(<NovaAtividadeDialog open={true} nomesExistentes={['Trabalho']} onCriar={onCriar} onCancelar={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/nome da nova atividade/i), 'Trabalho');
    await userEvent.click(screen.getByRole('button', { name: /criar e alocar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Já existe uma atividade chamada "Trabalho".');
    expect(onCriar).not.toHaveBeenCalled();
  });

  it('chama onCancelar ao clicar em "Cancelar"', async () => {
    const onCancelar = vi.fn();
    render(<NovaAtividadeDialog open={true} nomesExistentes={[]} onCriar={vi.fn()} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
