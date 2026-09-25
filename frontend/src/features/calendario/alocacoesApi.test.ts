import * as http from '../../api/http.ts';
import {
  atualizarAlocacao,
  criarAlocacao,
  excluirAlocacao,
  excluirAlocacoes,
  listarAlocacoes,
} from './alocacoesApi.ts';

vi.mock('../../api/http.ts');

// Garante que cada função fala com a rota certa do contrato (CLAUDE.md,
// seção 7.3) — o comportamento das rotas em si é coberto no backend
// (backend/test/alocar-atividades-no-calendario.e2e-spec.ts e
// limpar-calendario.e2e-spec.ts).
describe('alocacoesApi', () => {
  beforeEach(() => {
    vi.mocked(http.requisitar).mockReset().mockResolvedValue(undefined);
  });

  it('listarAlocacoes faz GET /alocacoes autenticado', async () => {
    await listarAlocacoes('token-123');

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes', { accessToken: 'token-123' });
  });

  it('criarAlocacao faz POST /alocacoes com atividade, dia, horário e duração', async () => {
    const dados = { atividadeId: 'a1', diaSemana: 'segunda-feira' as const, horaInicio: '09:00', duracaoMinutos: 60 };

    await criarAlocacao('token-123', dados);

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes', {
      metodo: 'POST',
      corpo: dados,
      accessToken: 'token-123',
    });
  });

  it('atualizarAlocacao faz PATCH /alocacoes/:id só com os campos alterados', async () => {
    await atualizarAlocacao('token-123', 'l1', { duracaoMinutos: 90 });

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes/l1', {
      metodo: 'PATCH',
      corpo: { duracaoMinutos: 90 },
      accessToken: 'token-123',
    });
  });

  it('excluirAlocacao faz DELETE /alocacoes/:id', async () => {
    await excluirAlocacao('token-123', 'l1');

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes/l1', { metodo: 'DELETE', accessToken: 'token-123' });
  });

  it('excluirAlocacoes sem atividade faz DELETE /alocacoes ("Limpar calendário")', async () => {
    await excluirAlocacoes('token-123');

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes', { metodo: 'DELETE', accessToken: 'token-123' });
  });

  it('excluirAlocacoes com atividade faz DELETE /alocacoes?atividadeId=', async () => {
    await excluirAlocacoes('token-123', 'a1');

    expect(http.requisitar).toHaveBeenCalledWith('/alocacoes?atividadeId=a1', {
      metodo: 'DELETE',
      accessToken: 'token-123',
    });
  });
});
