import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createTestApp, registrarEAutenticar, startPostgresContainer, UsuarioDeTeste } from './setup/test-app.js';

// Cenários Gherkin: docs/requisitos.md, Feature "Limpar calendário".
//
// "Pede confirmação" e "Cancelar a confirmação não altera o calendário" são
// puramente de UI: enquanto o usuário não confirma, nenhuma chamada de API
// acontece — não há nada para testar no backend nesses dois cenários (ficam
// cobertos na suíte de frontend). Aqui testamos só o efeito de, de fato,
// confirmar a limpeza.
describe('Limpar calendário (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let usuario: UsuarioDeTeste;

  beforeAll(async () => {
    container = await startPostgresContainer();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  beforeEach(async () => {
    usuario = await registrarEAutenticar(app);
  });

  function autenticado() {
    return { Authorization: `Bearer ${usuario.accessToken}` };
  }

  it('Cenário: Confirmar limpeza remove todos os clones e preserva a pool', async () => {
    // Dado que existem alocações de "Trabalho", "Almoço" e "Estudar Inglês" na semana
    const nomes = ['Trabalho', 'Almoço', 'Estudar Inglês'];
    for (const nome of nomes) {
      const atividade = await request(app.getHttpServer())
        .post('/atividades')
        .set(autenticado())
        .send({ nome, cor: '#123456' });
      await request(app.getHttpServer())
        .post('/alocacoes')
        .set(autenticado())
        .send({
          atividadeId: atividade.body.id,
          diaSemana: 'segunda-feira',
          horaInicio: '09:00',
          duracaoMinutos: 60,
        })
        .expect(201);
    }

    // Quando eu clico no botão "Limpar calendário" e confirmo a limpeza
    await request(app.getHttpServer()).delete('/alocacoes').set(autenticado()).expect(204);

    // Então nenhuma alocação deve permanecer em nenhum dia do calendário
    const alocacoes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(alocacoes.body).toEqual([]);

    // E as atividades devem continuar na pool
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body.map((atividade: { nome: string }) => atividade.nome).sort()).toEqual(nomes.sort());
  });
});
