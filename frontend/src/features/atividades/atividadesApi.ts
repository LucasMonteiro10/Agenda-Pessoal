import { requisitar } from '../../api/http.ts';
import type { Atividade } from './AtividadeItem.tsx';

// Rotas de Atividade do contrato em CLAUDE.md, seção 7.3. `PATCH
// /atividades/:id` existe no backend, mas ainda não há tela de edição —
// fica de fora até existir quem a use (regra 5, seção 4).

export function listarAtividades(accessToken: string): Promise<Atividade[]> {
  return requisitar('/atividades', { accessToken });
}

export function criarAtividade(accessToken: string, dados: Omit<Atividade, 'id'>): Promise<Atividade> {
  return requisitar('/atividades', { metodo: 'POST', corpo: dados, accessToken });
}

// O backend remove as alocações da atividade em cascata (onDelete: 'CASCADE').
export function excluirAtividade(accessToken: string, id: string): Promise<void> {
  return requisitar(`/atividades/${id}`, { metodo: 'DELETE', accessToken });
}
