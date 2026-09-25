import { requisitar } from '../../api/http.ts';
import type { DiaSemana } from './dia-semana.ts';
import type { Alocacao } from './tipos.ts';

// Rotas de Alocação do contrato em CLAUDE.md, seção 7.3. As respostas já
// vêm com `atividade: { id, nome, cor }` embutido (join no backend).

export interface DadosNovaAlocacao {
  atividadeId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  duracaoMinutos: number;
}

export type MudancasAlocacao = Partial<Pick<Alocacao, 'diaSemana' | 'horaInicio' | 'duracaoMinutos'>>;

export function listarAlocacoes(accessToken: string): Promise<Alocacao[]> {
  return requisitar('/alocacoes', { accessToken });
}

// Também é como "Duplicar" é implementado: repete os campos do card original.
export function criarAlocacao(accessToken: string, dados: DadosNovaAlocacao): Promise<Alocacao> {
  return requisitar('/alocacoes', { metodo: 'POST', corpo: dados, accessToken });
}

// Mover (dia/horário) e redimensionar (duração).
export function atualizarAlocacao(accessToken: string, id: string, mudancas: MudancasAlocacao): Promise<Alocacao> {
  return requisitar(`/alocacoes/${id}`, { metodo: 'PATCH', corpo: mudancas, accessToken });
}

export function excluirAlocacao(accessToken: string, id: string): Promise<void> {
  return requisitar(`/alocacoes/${id}`, { metodo: 'DELETE', accessToken });
}

// Sem `atividadeId`: "Limpar calendário" (todas as alocações do usuário).
// Com `atividadeId`: "Excluir alocações" do menu do card (só as daquela
// atividade). Nos dois casos a Atividade continua na pool.
export function excluirAlocacoes(accessToken: string, atividadeId?: string): Promise<void> {
  const caminho = atividadeId ? `/alocacoes?atividadeId=${encodeURIComponent(atividadeId)}` : '/alocacoes';
  return requisitar(caminho, { metodo: 'DELETE', accessToken });
}
