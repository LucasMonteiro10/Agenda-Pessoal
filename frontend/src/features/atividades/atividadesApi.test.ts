import * as http from '../../api/http.ts';
import { criarAtividade, excluirAtividade, listarAtividades } from './atividadesApi.ts';

vi.mock('../../api/http.ts');

// Garante que cada função fala com a rota certa do contrato (CLAUDE.md,
// seção 7.3) — o comportamento das rotas em si é coberto no backend
// (backend/test/gerenciar-pool-de-atividades.e2e-spec.ts).
describe('atividadesApi', () => {
  beforeEach(() => {
    vi.mocked(http.requisitar).mockReset().mockResolvedValue(undefined);
  });

  it('listarAtividades faz GET /atividades autenticado', async () => {
    await listarAtividades('token-123');

    expect(http.requisitar).toHaveBeenCalledWith('/atividades', { accessToken: 'token-123' });
  });

  it('criarAtividade faz POST /atividades com nome e cor', async () => {
    await criarAtividade('token-123', { nome: 'Trabalho', cor: '#2F4B3C' });

    expect(http.requisitar).toHaveBeenCalledWith('/atividades', {
      metodo: 'POST',
      corpo: { nome: 'Trabalho', cor: '#2F4B3C' },
      accessToken: 'token-123',
    });
  });

  it('excluirAtividade faz DELETE /atividades/:id', async () => {
    await excluirAtividade('token-123', 'a1');

    expect(http.requisitar).toHaveBeenCalledWith('/atividades/a1', { metodo: 'DELETE', accessToken: 'token-123' });
  });
});
