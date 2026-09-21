import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtividadeItem } from './AtividadeItem.tsx';

// Cenário Gherkin: docs/requisitos.md, Feature "Gerenciar pool de
// atividades" > "Excluir uma atividade pede confirmação e remove seus
// clones". A cascata em si (remover as Alocações) é responsabilidade do
// backend (já testada em gerenciar-pool-de-atividades.e2e-spec.ts); aqui só
// validamos a parte de UI: o pedido de confirmação antes de disparar a
// exclusão.
describe('AtividadeItem', () => {
  const atividade = { id: 'atividade-1', nome: 'Trabalho', cor: '#000000' };

  it('exibe o nome da atividade na pool', () => {
    render(<AtividadeItem atividade={atividade} onExcluir={vi.fn()} />);

    expect(screen.getByText('Trabalho')).toBeInTheDocument();
  });

  it('pede confirmação antes de excluir e só chama onExcluir se confirmado', async () => {
    const onExcluir = vi.fn();
    render(<AtividadeItem atividade={atividade} onExcluir={onExcluir} />);

    // Quando eu clico para excluir a atividade "Trabalho" da pool
    await userEvent.click(screen.getByRole('button', { name: /excluir/i }));

    // Então o sistema deve exibir uma mensagem de confirmação
    expect(screen.getByRole('dialog')).toHaveTextContent('Trabalho');
    expect(onExcluir).not.toHaveBeenCalled();

    // Quando eu confirmo a exclusão
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    // Então a exclusão é efetivada (delegada ao backend via este callback)
    expect(onExcluir).toHaveBeenCalledWith('atividade-1');
  });

  it('não chama onExcluir se a exclusão for cancelada', async () => {
    const onExcluir = vi.fn();
    render(<AtividadeItem atividade={atividade} onExcluir={onExcluir} />);

    await userEvent.click(screen.getByRole('button', { name: /excluir/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onExcluir).not.toHaveBeenCalled();
  });

  // Cenário: o card da pool é preenchido com a cor da Atividade escolhida
  // pelo usuário — sem contraste, uma cor muito clara ou muito escura deixa
  // o nome/botão ilegíveis (mesmo cálculo usado nos cards do calendário, ver
  // utils/cor.ts).
  it('preenche o fundo do card com a cor da atividade e usa texto preto sobre cor clara', () => {
    const atividadeClara = { id: 'atividade-clara', nome: 'Card Claro', cor: '#ffff66' };
    render(<AtividadeItem atividade={atividadeClara} onExcluir={vi.fn()} />);

    const card = screen.getByText('Card Claro').closest('.atividade-card');
    expect(card).toHaveStyle({ backgroundColor: 'rgb(255, 255, 102)', color: 'rgb(0, 0, 0)' });
  });

  it('usa texto branco sobre uma cor de fundo escura', () => {
    const atividadeEscura = { id: 'atividade-escura', nome: 'Card Escuro', cor: '#1a0033' };
    render(<AtividadeItem atividade={atividadeEscura} onExcluir={vi.fn()} />);

    const card = screen.getByText('Card Escuro').closest('.atividade-card');
    expect(card).toHaveStyle({ backgroundColor: 'rgb(26, 0, 51)', color: 'rgb(255, 255, 255)' });
  });
});
