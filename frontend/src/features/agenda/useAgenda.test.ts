import { act, renderHook, waitFor } from '@testing-library/react';
import { ErroHttp } from '../../api/http.ts';
import * as atividadesApi from '../atividades/atividadesApi.ts';
import * as alocacoesApi from '../calendario/alocacoesApi.ts';
import type { Alocacao } from '../calendario/tipos.ts';
import { useAgenda } from './useAgenda.ts';

// As APIs falam com o backend de verdade (fetch) — aqui mockamos; os
// cenários e2e de backend/test/*.e2e-spec.ts já cobrem as rotas.
vi.mock('../atividades/atividadesApi.ts');
vi.mock('../calendario/alocacoesApi.ts');

const TOKEN = 'token-123';
const trabalho = { id: 'a1', nome: 'Trabalho', cor: '#2F4B3C' };
const almoco = { id: 'a2', nome: 'Almoço', cor: '#D8A15C' };
const trabalhoSegunda: Alocacao = {
  id: 'l1',
  atividade: trabalho,
  diaSemana: 'segunda-feira',
  horaInicio: '09:00',
  duracaoMinutos: 60,
};
const almocoSegunda: Alocacao = {
  id: 'l2',
  atividade: almoco,
  diaSemana: 'segunda-feira',
  horaInicio: '12:00',
  duracaoMinutos: 60,
};

async function renderizarCarregado(onNaoAutorizado = vi.fn()) {
  const hook = renderHook(() => useAgenda(TOKEN, onNaoAutorizado));
  await waitFor(() => expect(hook.result.current.atividades).toHaveLength(2));
  return hook;
}

describe('useAgenda', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(atividadesApi.listarAtividades).mockResolvedValue([trabalho, almoco]);
    vi.mocked(alocacoesApi.listarAlocacoes).mockResolvedValue([trabalhoSegunda, almocoSegunda]);
  });

  it('Cenário: Atividades e alocações continuam salvas depois de recarregar a página', async () => {
    // Dado que eu tenho atividades e alocações salvas no backend
    // Quando eu abro a agenda
    const { result } = await renderizarCarregado();

    // Então eu devo ver exatamente o que está salvo
    expect(atividadesApi.listarAtividades).toHaveBeenCalledWith(TOKEN);
    expect(alocacoesApi.listarAlocacoes).toHaveBeenCalledWith(TOKEN);
    expect(result.current.atividades).toEqual([trabalho, almoco]);
    expect(result.current.alocacoes).toEqual([trabalhoSegunda, almocoSegunda]);
  });

  it('criar atividade salva no backend e adiciona a atividade devolvida à pool', async () => {
    const estudar = { id: 'a3', nome: 'Estudar Inglês', cor: '#93AFC7' };
    vi.mocked(atividadesApi.criarAtividade).mockResolvedValue(estudar);
    const { result } = await renderizarCarregado();

    await act(() => result.current.criarAtividade('Estudar Inglês', '#93AFC7'));

    expect(atividadesApi.criarAtividade).toHaveBeenCalledWith(TOKEN, { nome: 'Estudar Inglês', cor: '#93AFC7' });
    expect(result.current.atividades).toEqual([trabalho, almoco, estudar]);
  });

  it('excluir atividade remove a atividade e suas alocações (cascata)', async () => {
    vi.mocked(atividadesApi.excluirAtividade).mockResolvedValue(undefined);
    const { result } = await renderizarCarregado();

    await act(() => result.current.excluirAtividade('a1'));

    expect(atividadesApi.excluirAtividade).toHaveBeenCalledWith(TOKEN, 'a1');
    expect(result.current.atividades).toEqual([almoco]);
    expect(result.current.alocacoes).toEqual([almocoSegunda]);
  });

  it('Cenário: Editar nome e cor propaga para a pool e para todos os clones da atividade', async () => {
    // Dado que a atividade "Trabalho" possui alocações na segunda-feira e na sexta-feira
    const trabalhoSexta: Alocacao = { ...trabalhoSegunda, id: 'l3', diaSemana: 'sexta-feira', horaInicio: '19:00' };
    vi.mocked(alocacoesApi.listarAlocacoes).mockResolvedValue([trabalhoSegunda, almocoSegunda, trabalhoSexta]);
    const editada = { id: 'a1', nome: 'Trabalho remoto', cor: '#33FF81' };
    vi.mocked(atividadesApi.atualizarAtividade).mockResolvedValue(editada);
    const { result } = await renderizarCarregado();

    // Quando eu altero o nome e a cor da atividade
    await act(() => result.current.editarAtividade('a1', 'Trabalho remoto', '#33FF81'));

    expect(atividadesApi.atualizarAtividade).toHaveBeenCalledWith(TOKEN, 'a1', {
      nome: 'Trabalho remoto',
      cor: '#33FF81',
    });
    // Então o nome e a cor devem ser atualizados na pool
    expect(result.current.atividades).toEqual([editada, almoco]);
    // E em todas as alocações dessa atividade — dia, horário e duração de
    // cada clone continuam os mesmos; as de outras atividades não mudam
    expect(result.current.alocacoes).toEqual([
      { ...trabalhoSegunda, atividade: editada },
      almocoSegunda,
      { ...trabalhoSexta, atividade: editada },
    ]);
  });

  it('se o backend recusar a edição, pool e calendário continuam como estavam e um erro é exibido', async () => {
    vi.mocked(atividadesApi.atualizarAtividade).mockRejectedValue(new Error('Já existe uma atividade com esse nome'));
    const { result } = await renderizarCarregado();

    await act(() => result.current.editarAtividade('a1', 'Almoço', '#2F4B3C'));

    expect(result.current.erro).toBe('Já existe uma atividade com esse nome');
    expect(result.current.atividades).toEqual([trabalho, almoco]);
    expect(result.current.alocacoes).toEqual([trabalhoSegunda, almocoSegunda]);
  });

  it('criar alocação (arrastar da pool) salva no backend com duração padrão de 1 hora', async () => {
    const nova: Alocacao = { ...trabalhoSegunda, id: 'l3', diaSemana: 'terca-feira', horaInicio: '10:00' };
    vi.mocked(alocacoesApi.criarAlocacao).mockResolvedValue(nova);
    const { result } = await renderizarCarregado();

    await act(() => result.current.criarAlocacao('a1', 'terca-feira', '10:00'));

    expect(alocacoesApi.criarAlocacao).toHaveBeenCalledWith(TOKEN, {
      atividadeId: 'a1',
      diaSemana: 'terca-feira',
      horaInicio: '10:00',
      duracaoMinutos: 60,
    });
    expect(result.current.alocacoes).toEqual([trabalhoSegunda, almocoSegunda, nova]);
  });

  it('criar atividade a partir de um espaço vazio salva a atividade e a alocação', async () => {
    const academia = { id: 'a3', nome: 'Academia', cor: '#111111' };
    const alocacaoAcademia: Alocacao = {
      id: 'l3',
      atividade: academia,
      diaSemana: 'quarta-feira',
      horaInicio: '07:00',
      duracaoMinutos: 60,
    };
    vi.mocked(atividadesApi.criarAtividade).mockResolvedValue(academia);
    vi.mocked(alocacoesApi.criarAlocacao).mockResolvedValue(alocacaoAcademia);
    const { result } = await renderizarCarregado();

    await act(() => result.current.criarAtividadeEAlocar('Academia', '#111111', 'quarta-feira', '07:00'));

    expect(alocacoesApi.criarAlocacao).toHaveBeenCalledWith(TOKEN, {
      atividadeId: 'a3',
      diaSemana: 'quarta-feira',
      horaInicio: '07:00',
      duracaoMinutos: 60,
    });
    expect(result.current.atividades).toContainEqual(academia);
    expect(result.current.alocacoes).toContainEqual(alocacaoAcademia);
  });

  it('mover alocação salva o novo dia e horário no backend', async () => {
    const movida: Alocacao = { ...trabalhoSegunda, diaSemana: 'sexta-feira', horaInicio: '14:30' };
    vi.mocked(alocacoesApi.atualizarAlocacao).mockResolvedValue(movida);
    const { result } = await renderizarCarregado();

    await act(() => result.current.moverAlocacao('l1', 'sexta-feira', '14:30'));

    expect(alocacoesApi.atualizarAlocacao).toHaveBeenCalledWith(TOKEN, 'l1', {
      diaSemana: 'sexta-feira',
      horaInicio: '14:30',
    });
    expect(result.current.alocacoes).toEqual([movida, almocoSegunda]);
  });

  it('se o backend recusar o movimento, o card volta para a posição original e um erro é exibido', async () => {
    vi.mocked(alocacoesApi.atualizarAlocacao).mockRejectedValue(new Error('Alocação não encontrada'));
    const { result } = await renderizarCarregado();

    await act(() => result.current.moverAlocacao('l1', 'sexta-feira', '14:30'));

    expect(result.current.alocacoes).toEqual([trabalhoSegunda, almocoSegunda]);
    expect(result.current.erro).toBe('Alocação não encontrada');
  });

  it('redimensionar alocação salva a nova duração no backend', async () => {
    const redimensionada: Alocacao = { ...trabalhoSegunda, duracaoMinutos: 95 };
    vi.mocked(alocacoesApi.atualizarAlocacao).mockResolvedValue(redimensionada);
    const { result } = await renderizarCarregado();

    await act(() => result.current.redimensionarAlocacao('l1', 95));

    expect(alocacoesApi.atualizarAlocacao).toHaveBeenCalledWith(TOKEN, 'l1', { duracaoMinutos: 95 });
    expect(result.current.alocacoes).toEqual([redimensionada, almocoSegunda]);
  });

  it('duplicar cria no backend um clone com os mesmos dia, horário e duração do original', async () => {
    const clone: Alocacao = { ...trabalhoSegunda, id: 'l3' };
    vi.mocked(alocacoesApi.criarAlocacao).mockResolvedValue(clone);
    const { result } = await renderizarCarregado();

    await act(() => result.current.duplicarAlocacao('l1'));

    expect(alocacoesApi.criarAlocacao).toHaveBeenCalledWith(TOKEN, {
      atividadeId: 'a1',
      diaSemana: 'segunda-feira',
      horaInicio: '09:00',
      duracaoMinutos: 60,
    });
    expect(result.current.alocacoes).toEqual([trabalhoSegunda, almocoSegunda, clone]);
  });

  it('excluir alocação remove só aquele card', async () => {
    vi.mocked(alocacoesApi.excluirAlocacao).mockResolvedValue(undefined);
    const { result } = await renderizarCarregado();

    await act(() => result.current.excluirAlocacao('l1'));

    expect(alocacoesApi.excluirAlocacao).toHaveBeenCalledWith(TOKEN, 'l1');
    expect(result.current.alocacoes).toEqual([almocoSegunda]);
  });

  it('excluir alocações a partir do card remove os clones da atividade e mantém a atividade na pool', async () => {
    vi.mocked(alocacoesApi.excluirAlocacoes).mockResolvedValue(undefined);
    const { result } = await renderizarCarregado();

    await act(() => result.current.excluirAlocacoesDaAtividade('a1'));

    expect(alocacoesApi.excluirAlocacoes).toHaveBeenCalledWith(TOKEN, 'a1');
    expect(result.current.alocacoes).toEqual([almocoSegunda]);
    expect(result.current.atividades).toEqual([trabalho, almoco]);
  });

  it('limpar calendário remove todas as alocações no backend e preserva a pool', async () => {
    vi.mocked(alocacoesApi.excluirAlocacoes).mockResolvedValue(undefined);
    const { result } = await renderizarCarregado();

    await act(() => result.current.limparCalendario());

    expect(alocacoesApi.excluirAlocacoes).toHaveBeenCalledWith(TOKEN);
    expect(result.current.alocacoes).toEqual([]);
    expect(result.current.atividades).toEqual([trabalho, almoco]);
  });

  it('erro do backend ao criar atividade exibe a mensagem e não altera a pool', async () => {
    vi.mocked(atividadesApi.criarAtividade).mockRejectedValue(new Error('Já existe uma atividade com esse nome'));
    const { result } = await renderizarCarregado();

    await act(() => result.current.criarAtividade('Trabalho', '#000000'));

    expect(result.current.erro).toBe('Já existe uma atividade com esse nome');
    expect(result.current.atividades).toEqual([trabalho, almoco]);
  });

  it('a próxima ação bem-sucedida limpa o erro anterior', async () => {
    vi.mocked(atividadesApi.criarAtividade).mockRejectedValueOnce(new Error('Falhou'));
    vi.mocked(alocacoesApi.excluirAlocacao).mockResolvedValue(undefined);
    const { result } = await renderizarCarregado();

    await act(() => result.current.criarAtividade('Trabalho', '#000000'));
    await act(() => result.current.excluirAlocacao('l1'));

    expect(result.current.erro).toBeNull();
  });

  it('token inválido ou expirado (401) desloga o usuário', async () => {
    vi.mocked(atividadesApi.listarAtividades).mockRejectedValue(new ErroHttp('Unauthorized', 401));
    const onNaoAutorizado = vi.fn();

    renderHook(() => useAgenda(TOKEN, onNaoAutorizado));

    await waitFor(() => expect(onNaoAutorizado).toHaveBeenCalledTimes(1));
  });
});
