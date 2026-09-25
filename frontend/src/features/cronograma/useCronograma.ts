import { useEffect, useRef, useState } from 'react';
import { ErroHttp } from '../../api/http.ts';
import type { Atividade } from '../atividades/AtividadeItem.tsx';
import * as atividadesApi from '../atividades/atividadesApi.ts';
import * as alocacoesApi from '../calendario/alocacoesApi.ts';
import type { DiaSemana } from '../calendario/dia-semana.ts';
import type { Alocacao } from '../calendario/tipos.ts';

// Mesma duração que o card arrastado da pool mostra enquanto é arrastado
// (`duration: '01:00'` em PoolLateral) e que o formulário do espaço vazio
// usa — Feature "Alocar atividades no calendário".
const DURACAO_PADRAO_MINUTOS = 60;

const MENSAGEM_ERRO_PADRAO = 'Não foi possível completar a solicitação. Tente novamente.';

// Estado de Atividades/Alocações do usuário autenticado, sempre espelhando o
// backend: carrega tudo ao montar e salva cada ação antes de refletir na
// tela. Antes disso o estado vivia só em `useState` no App — recarregar a
// página (ex.: reiniciar o Docker, que dispara o reload do Vite) apagava
// tudo, já que nada chegava ao banco.
//
// Exceção: mover/redimensionar são otimistas. O FullCalendar já desenha o
// card na posição nova antes de avisar a gente, então a tela é atualizada na
// hora e, se o backend recusar, o card volta para onde estava.
export function useCronograma(accessToken: string, onNaoAutorizado: () => void) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // Ref em vez de dependência do efeito: o App recria `onNaoAutorizado` a
  // cada render, e isso não deve disparar uma nova carga dos dados.
  const onNaoAutorizadoRef = useRef(onNaoAutorizado);
  useEffect(() => {
    onNaoAutorizadoRef.current = onNaoAutorizado;
  });

  function tratarErro(e: unknown) {
    // Token expirado (7 dias, ver AuthModule) ou inválido: não adianta
    // mostrar erro, o usuário precisa logar de novo.
    if (e instanceof ErroHttp && e.status === 401) {
      onNaoAutorizadoRef.current();
      return;
    }
    setErro(e instanceof Error ? e.message : MENSAGEM_ERRO_PADRAO);
  }

  // Envolve cada ação: limpa o erro anterior e trata a falha num só lugar.
  async function executar(acao: () => Promise<void>) {
    setErro(null);
    try {
      await acao();
    } catch (e) {
      tratarErro(e);
    }
  }

  useEffect(() => {
    // Evita aplicar a resposta de uma carga que ficou obsoleta — ex.: o
    // StrictMode monta/desmonta/monta de novo em dev, disparando duas cargas.
    let obsoleta = false;

    Promise.all([atividadesApi.listarAtividades(accessToken), alocacoesApi.listarAlocacoes(accessToken)])
      .then(([atividadesSalvas, alocacoesSalvas]) => {
        if (obsoleta) return;
        setAtividades(atividadesSalvas);
        setAlocacoes(alocacoesSalvas);
      })
      .catch((e: unknown) => {
        if (!obsoleta) tratarErro(e);
      });

    return () => {
      obsoleta = true;
    };
    // `tratarErro` só usa setters estáveis e a ref — não precisa ser dependência.
  }, [accessToken]);

  async function adicionarAlocacao(dados: alocacoesApi.DadosNovaAlocacao) {
    const nova = await alocacoesApi.criarAlocacao(accessToken, dados);
    setAlocacoes((atual) => [...atual, nova]);
  }

  async function atualizarAlocacaoOtimista(id: string, mudancas: alocacoesApi.MudancasAlocacao) {
    const original = alocacoes.find((alocacao) => alocacao.id === id);
    if (!original) return;

    const substituir = (nova: Alocacao) =>
      setAlocacoes((atual) => atual.map((alocacao) => (alocacao.id === id ? nova : alocacao)));

    substituir({ ...original, ...mudancas });
    await executar(async () => {
      try {
        substituir(await alocacoesApi.atualizarAlocacao(accessToken, id, mudancas));
      } catch (e) {
        substituir(original);
        throw e;
      }
    });
  }

  return {
    atividades,
    alocacoes,
    erro,

    criarAtividade: (nome: string, cor: string) =>
      executar(async () => {
        const nova = await atividadesApi.criarAtividade(accessToken, { nome, cor });
        setAtividades((atual) => [...atual, nova]);
      }),

    // O backend cascateia a exclusão para as alocações; aqui só espelhamos.
    excluirAtividade: (atividadeId: string) =>
      executar(async () => {
        await atividadesApi.excluirAtividade(accessToken, atividadeId);
        setAtividades((atual) => atual.filter((atividade) => atividade.id !== atividadeId));
        setAlocacoes((atual) => atual.filter((alocacao) => alocacao.atividade.id !== atividadeId));
      }),

    criarAlocacao: (atividadeId: string, diaSemana: DiaSemana, horaInicio: string) =>
      executar(() => adicionarAlocacao({ atividadeId, diaSemana, horaInicio, duracaoMinutos: DURACAO_PADRAO_MINUTOS })),

    criarAtividadeEAlocar: (nome: string, cor: string, diaSemana: DiaSemana, horaInicio: string) =>
      executar(async () => {
        const nova = await atividadesApi.criarAtividade(accessToken, { nome, cor });
        setAtividades((atual) => [...atual, nova]);
        await adicionarAlocacao({ atividadeId: nova.id, diaSemana, horaInicio, duracaoMinutos: DURACAO_PADRAO_MINUTOS });
      }),

    moverAlocacao: (id: string, diaSemana: DiaSemana, horaInicio: string) =>
      atualizarAlocacaoOtimista(id, { diaSemana, horaInicio }),

    redimensionarAlocacao: (id: string, duracaoMinutos: number) => atualizarAlocacaoOtimista(id, { duracaoMinutos }),

    duplicarAlocacao: (id: string) =>
      executar(async () => {
        const original = alocacoes.find((alocacao) => alocacao.id === id);
        if (!original) return;
        await adicionarAlocacao({
          atividadeId: original.atividade.id,
          diaSemana: original.diaSemana,
          horaInicio: original.horaInicio,
          duracaoMinutos: original.duracaoMinutos,
        });
      }),

    excluirAlocacao: (id: string) =>
      executar(async () => {
        await alocacoesApi.excluirAlocacao(accessToken, id);
        setAlocacoes((atual) => atual.filter((alocacao) => alocacao.id !== id));
      }),

    // "Excluir alocações" do menu do card: a atividade continua na pool.
    excluirAlocacoesDaAtividade: (atividadeId: string) =>
      executar(async () => {
        await alocacoesApi.excluirAlocacoes(accessToken, atividadeId);
        setAlocacoes((atual) => atual.filter((alocacao) => alocacao.atividade.id !== atividadeId));
      }),

    limparCalendario: () =>
      executar(async () => {
        await alocacoesApi.excluirAlocacoes(accessToken);
        setAlocacoes([]);
      }),
  };
}
