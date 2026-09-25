import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarioSemanal, type CalendarioSemanalProps } from './CalendarioSemanal.tsx';
import type { Alocacao } from './tipos.ts';

// jsdom não implementa ResizeObserver — usado por CalendarioSemanal para
// ajustar o layout dos cards (ajustarLinhaUnica), irrelevante aqui.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Cenários Gherkin: docs/requisitos.md, Feature "Interagir com um card de
// alocação" > "Clicar em um card abre o menu de opções" e "Editar a
// atividade a partir de um card reflete na pool e em todos os clones". A
// propagação em si é do backend + useCronograma — aqui só o menu/formulário.
// Arrastar/redimensionar continuam sem teste de UI (CLAUDE.md, seção 6).
describe('CalendarioSemanal — menu do card', () => {
  const estudar = { id: 'a1', nome: 'Estudar Inglês', cor: '#3366ff' };
  const alocacaoSegunda: Alocacao = {
    id: 'l1',
    atividade: estudar,
    diaSemana: 'segunda-feira',
    horaInicio: '09:00',
    duracaoMinutos: 60,
  };

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverFalso);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderizar(overrides: Partial<CalendarioSemanalProps> = {}) {
    const props: CalendarioSemanalProps = {
      diaInicioSemana: 'domingo',
      granularidadeMinutos: 30,
      alocacoes: [alocacaoSegunda],
      nomesAtividadesExistentes: ['Estudar Inglês', 'Trabalho'],
      onCriarAlocacao: vi.fn(),
      onMoverAlocacao: vi.fn(),
      onRedimensionarAlocacao: vi.fn(),
      onDuplicar: vi.fn(),
      onExcluir: vi.fn(),
      onExcluirAlocacoesDaAtividade: vi.fn(),
      onCriarAtividadeEAlocar: vi.fn(),
      onEditarAtividade: vi.fn(),
      ...overrides,
    };
    render(<CalendarioSemanal {...props} />);
    return props;
  }

  it('Cenário: Clicar em um card abre o menu com Duplicar, Editar atividade, Excluir e Excluir alocações', async () => {
    renderizar();

    await userEvent.click(screen.getByText('Estudar Inglês'));

    const opcoes = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(opcoes).toEqual(['Duplicar', 'Editar atividade', 'Excluir', 'Excluir alocações']);
  });

  it('Cenário: Editar a atividade a partir de um card chama onEditarAtividade com a atividade do card', async () => {
    const { onEditarAtividade } = renderizar();

    // Quando eu clico em "Editar atividade" nas opções do card
    await userEvent.click(screen.getByText('Estudar Inglês'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar atividade' }));

    // O formulário abre com os dados atuais da atividade e o menu fecha
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const campoNome = screen.getByLabelText(/nome da atividade/i);
    expect(campoNome).toHaveValue('Estudar Inglês');

    // E altero o nome para "Inglês - Duolingo"
    await userEvent.clear(campoNome);
    await userEvent.type(campoNome, 'Inglês - Duolingo');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onEditarAtividade).toHaveBeenCalledWith('a1', 'Inglês - Duolingo', '#3366ff');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelar a edição a partir do card não chama onEditarAtividade', async () => {
    const { onEditarAtividade } = renderizar();

    await userEvent.click(screen.getByText('Estudar Inglês'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar atividade' }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onEditarAtividade).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
