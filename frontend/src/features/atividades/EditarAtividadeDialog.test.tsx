import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditarAtividadeDialog } from './EditarAtividadeDialog.tsx';

// Cenários Gherkin: docs/requisitos.md, Feature "Gerenciar pool de
// atividades" > "Editar nome e cor propaga para todos os clones", "Editar só
// o nome ou só a cor de uma atividade" e "Impedir renomear uma atividade
// para um nome que já existe". A propagação para os clones em si é do
// backend (join) + useAgenda — aqui só a parte de formulário.
describe('EditarAtividadeDialog', () => {
  const atividade = { id: 'a1', nome: 'Estudar Inglês', cor: '#3366ff' };

  function renderizar(overrides: Partial<Parameters<typeof EditarAtividadeDialog>[0]> = {}) {
    const props = {
      atividade,
      nomesExistentes: ['Estudar Inglês', 'Trabalho'],
      onSalvar: vi.fn(),
      onCancelar: vi.fn(),
      ...overrides,
    };
    render(<EditarAtividadeDialog {...props} />);
    return props;
  }

  it('abre com o nome e a cor atuais da atividade preenchidos', () => {
    renderizar();

    expect(screen.getByRole('dialog', { name: /editar atividade/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da atividade/i)).toHaveValue('Estudar Inglês');
    expect(screen.getByLabelText(/cor da atividade/i)).toHaveValue('#3366ff');
  });

  it('Cenário: Editar nome e cor — chama onSalvar com o novo nome e a nova cor', async () => {
    const { onSalvar } = renderizar();

    // Quando eu altero o nome da atividade para "Inglês - Duolingo"
    const campoNome = screen.getByLabelText(/nome da atividade/i);
    await userEvent.clear(campoNome);
    await userEvent.type(campoNome, 'Inglês - Duolingo');
    // E altero a cor da atividade para "#33FF81"
    fireEvent.change(screen.getByLabelText(/cor da atividade/i), { target: { value: '#33ff81' } });
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSalvar).toHaveBeenCalledWith('Inglês - Duolingo', '#33ff81');
  });

  it('Cenário: Editar só a cor — manter o próprio nome não conta como duplicado', async () => {
    const { onSalvar } = renderizar();

    fireEvent.change(screen.getByLabelText(/cor da atividade/i), { target: { value: '#33ff81' } });
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSalvar).toHaveBeenCalledWith('Estudar Inglês', '#33ff81');
  });

  it('mudar só maiúsculas/minúsculas do próprio nome também é permitido', async () => {
    const { onSalvar } = renderizar();

    const campoNome = screen.getByLabelText(/nome da atividade/i);
    await userEvent.clear(campoNome);
    await userEvent.type(campoNome, 'estudar inglês');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSalvar).toHaveBeenCalledWith('estudar inglês', '#3366ff');
  });

  it('Cenário: Impedir renomear para um nome que já existe', async () => {
    const { onSalvar } = renderizar();

    // Quando eu tento renomear "Estudar Inglês" para "Trabalho"
    const campoNome = screen.getByLabelText(/nome da atividade/i);
    await userEvent.clear(campoNome);
    await userEvent.type(campoNome, 'trabalho');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    // Então o sistema deve rejeitar a edição e avisar
    expect(screen.getByRole('alert')).toHaveTextContent('Já existe uma atividade chamada "trabalho".');
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('rejeita nome vazio', async () => {
    const { onSalvar } = renderizar();

    await userEvent.clear(screen.getByLabelText(/nome da atividade/i));
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Digite um nome para a atividade.');
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('remove espaços nas pontas do nome antes de salvar', async () => {
    const { onSalvar } = renderizar();

    const campoNome = screen.getByLabelText(/nome da atividade/i);
    await userEvent.clear(campoNome);
    await userEvent.type(campoNome, '  Yoga  ');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSalvar).toHaveBeenCalledWith('Yoga', '#3366ff');
  });

  it('chama onCancelar ao clicar em "Cancelar", sem salvar', async () => {
    const { onSalvar, onCancelar } = renderizar();

    await userEvent.type(screen.getByLabelText(/nome da atividade/i), ' alterado');
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onSalvar).not.toHaveBeenCalled();
  });
});
