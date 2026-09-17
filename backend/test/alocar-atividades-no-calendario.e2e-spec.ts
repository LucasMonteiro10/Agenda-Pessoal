import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createTestApp, registrarEAutenticar, startPostgresContainer, UsuarioDeTeste } from './setup/test-app.js';

// Cenários Gherkin: docs/requisitos.md, Features "Alocar atividades no
// calendário" e "Interagir com um card de alocação".
//
// Mapeamento de "Interagir com um card de alocação" para o backend: "abrir
// menu" e "cancelar exclusão" são só UI (sem chamada de API) — ficam na
// suíte de frontend. "Duplicar", "Excluir" (um card) e "Excluir atividade"
// (cascata) não precisam de endpoints próprios: são, respectivamente, o
// mesmo POST /alocacoes, o mesmo DELETE /alocacoes/:id e o mesmo
// DELETE /atividades/:id já teste aqui e em
// gerenciar-pool-de-atividades.e2e-spec.ts.
describe('Alocar atividades no calendário (e2e)', () => {
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

  async function criarAtividade(nome: string, cor = '#123456') {
    const response = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome, cor });
    return response.body.id as string;
  }

  it('Cenário: Arrastar atividade da pool para o calendário', async () => {
    // Dado que a atividade "Trabalho" está na pool
    const atividadeId = await criarAtividade('Trabalho');

    // Quando eu arrasto "Trabalho" para a coluna "Segunda-feira" no horário "09:00"
    const response = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '09:00', duracaoMinutos: 60 });

    // Então uma alocação de "Trabalho" deve aparecer nesse dia e horário
    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({ diaSemana: 'segunda-feira', horaInicio: '09:00', duracaoMinutos: 60 }),
    );

    // E a atividade "Trabalho" deve continuar disponível na pool para novas alocações
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toHaveLength(1);
  });

  it('Cenário: Mover uma alocação entre dias e horários', async () => {
    // Dado que existe uma alocação de "Almoço" na terça-feira às 12:00
    const atividadeId = await criarAtividade('Almoço');
    const alocacao = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'terca-feira', horaInicio: '12:00', duracaoMinutos: 60 });

    // Quando eu arrasto essa alocação para a quarta-feira às 13:00
    await request(app.getHttpServer())
      .patch(`/alocacoes/${alocacao.body.id}`)
      .set(autenticado())
      .send({ diaSemana: 'quarta-feira', horaInicio: '13:00' })
      .expect(200);

    // Então a alocação deve passar a aparecer na quarta-feira às 13:00
    // E deixar de aparecer na terça-feira às 12:00
    const alocacaoAtualizada = await request(app.getHttpServer())
      .get(`/alocacoes/${alocacao.body.id}`)
      .set(autenticado());
    expect(alocacaoAtualizada.body).toEqual(
      expect.objectContaining({ diaSemana: 'quarta-feira', horaInicio: '13:00' }),
    );
  });

  it('Cenário: Redimensionar a duração de uma alocação com valor livre', async () => {
    // Dado que a granularidade do calendário está configurada para 30 minutos
    // (a granularidade é só visual — item 2 das Suposições — então o backend
    // nem sabe qual granularidade o usuário escolheu; só a duração importa.)
    // E existe uma alocação de "Sono" das 23:00 às 23:30
    const atividadeId = await criarAtividade('Sono');
    const alocacao = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'domingo', horaInicio: '23:00', duracaoMinutos: 30 });

    // Quando eu arrasto a borda inferior do card para estender até as 00:17
    // (23:00 + 77 minutos = 00:17 do dia seguinte — um valor deliberadamente
    // "quebrado" para provar que não há snap em múltiplos de 15/30/60 min)
    await request(app.getHttpServer())
      .patch(`/alocacoes/${alocacao.body.id}`)
      .set(autenticado())
      .send({ duracaoMinutos: 77 })
      .expect(200);

    // Então a duração da alocação deve passar a ser das 23:00 às 00:17
    const alocacaoAtualizada = await request(app.getHttpServer())
      .get(`/alocacoes/${alocacao.body.id}`)
      .set(autenticado());
    expect(alocacaoAtualizada.body.duracaoMinutos).toBe(77);
  });

  it('Cenário: Permite sobreposição de alocações no mesmo dia/horário (sem bloqueio de conflito)', async () => {
    // A regra visual (card menor deslocado vs. grid dividido ao meio,
    // conforme durações iguais ou diferentes) é do frontend — ver suíte de
    // componentes. Aqui só validamos que o backend NUNCA rejeita a
    // sobreposição em si.
    //
    // Dado que existe uma alocação de "Trabalho" na segunda-feira das 09:00 às 12:00
    const trabalhoId = await criarAtividade('Trabalho');
    await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId: trabalhoId, diaSemana: 'segunda-feira', horaInicio: '09:00', duracaoMinutos: 180 })
      .expect(201);

    // Quando eu crio outra alocação de "Reunião" na segunda-feira das 10:00 às 11:00
    const reuniaoId = await criarAtividade('Reunião');
    const reuniao = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId: reuniaoId, diaSemana: 'segunda-feira', horaInicio: '10:00', duracaoMinutos: 60 });

    // Então ambas as alocações devem coexistir no mesmo dia e horário
    expect(reuniao.status).toBe(201);
    const todasAlocacoes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(todasAlocacoes.body).toHaveLength(2);
  });

  it('Cenário: Duplicar cria um clone com os mesmos dia, horário e duração do original', async () => {
    // Ver nota do arquivo: "Duplicar" na UI = um POST /alocacoes comum,
    // copiando os campos do card original.
    //
    // Dado que existe uma alocação de "Estudar Inglês" na segunda-feira às 19:00 por 1h
    const atividadeId = await criarAtividade('Estudar Inglês');
    const original = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '19:00', duracaoMinutos: 60 });

    // Quando eu clico em "Duplicar" nas opções do card
    const clone = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '19:00', duracaoMinutos: 60 });

    // Então uma nova alocação da atividade "Estudar Inglês" deve ser criada
    expect(clone.status).toBe(201);
    expect(clone.body.id).not.toBe(original.body.id);
    // E o clone deve herdar o nome e a cor da atividade original
    expect(clone.body.atividade).toEqual(original.body.atividade);

    // E o clone deve poder ser reposicionado independentemente do original
    await request(app.getHttpServer())
      .patch(`/alocacoes/${clone.body.id}`)
      .set(autenticado())
      .send({ diaSemana: 'sexta-feira', horaInicio: '20:00' })
      .expect(200);

    const originalInalterado = await request(app.getHttpServer())
      .get(`/alocacoes/${original.body.id}`)
      .set(autenticado());
    expect(originalInalterado.body).toEqual(
      expect.objectContaining({ diaSemana: 'segunda-feira', horaInicio: '19:00' }),
    );
  });

  it('Cenário: Excluir remove só aquele card', async () => {
    // Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    const atividadeId = await criarAtividade('Estudar Inglês');
    const segunda = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '19:00', duracaoMinutos: 60 });
    const sexta = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'sexta-feira', horaInicio: '19:00', duracaoMinutos: 60 });

    // Quando eu clico em "Excluir" nas opções do card da alocação de segunda-feira
    await request(app.getHttpServer())
      .delete(`/alocacoes/${segunda.body.id}`)
      .set(autenticado())
      .expect(204);

    // Então apenas a alocação de segunda-feira deve ser removida do calendário
    // E a alocação de sexta-feira deve continuar existindo
    const restantes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(restantes.body).toEqual([expect.objectContaining({ id: sexta.body.id })]);

    // E a atividade "Estudar Inglês" deve continuar na pool
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toHaveLength(1);
  });
});
