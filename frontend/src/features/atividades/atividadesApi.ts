import { requisitar } from '../../api/http.ts';
import type { Atividade } from './AtividadeItem.tsx';

// Rotas de Atividade do contrato em CLAUDE.md, seção 7.3.

export function listarAtividades(accessToken: string): Promise<Atividade[]> {
  return requisitar('/atividades', { accessToken });
}

export function criarAtividade(accessToken: string, dados: Omit<Atividade, 'id'>): Promise<Atividade> {
  return requisitar('/atividades', { metodo: 'POST', corpo: dados, accessToken });
}

// Nome/cor vivem só na Atividade (Alocação guarda apenas `atividadeId`), então
// uma única edição aqui já vale para todos os clones no backend.
export function atualizarAtividade(
  accessToken: string,
  id: string,
  mudancas: Partial<Omit<Atividade, 'id'>>,
): Promise<Atividade> {
  return requisitar(`/atividades/${id}`, { metodo: 'PATCH', corpo: mudancas, accessToken });
}

// O backend remove as alocações da atividade em cascata (onDelete: 'CASCADE').
export function excluirAtividade(accessToken: string, id: string): Promise<void> {
  return requisitar(`/atividades/${id}`, { metodo: 'DELETE', accessToken });
}
