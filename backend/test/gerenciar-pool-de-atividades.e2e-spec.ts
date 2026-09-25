import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createTestApp, registrarEAutenticar, startPostgresContainer, UsuarioDeTeste } from './setup/test-app.js';

// Cenários Gherkin: docs/requisitos.md, Feature "Gerenciar pool de atividades".
//
// Decisão de modelagem (documentada aqui porque nasce destes testes): uma
// Alocação não guarda cópia própria de nome/cor — ela só referencia o id da
// Atividade. Por isso "editar propaga" e "editar NÃO propaga" saem de graça
// da modelagem relacional: nome/cor vêm sempre da Atividade (join), dia/hora/
// duração são campos só da Alocação.
describe('Gerenciar pool de atividades (e2e)', () => {
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
    // Cada teste usa um usuário novo para não sofrer com a restrição de nome
    // único de Atividade (item 5 das Suposições) entre um teste e outro.
    usuario = await registrarEAutenticar(app);
  });

  function autenticado() {
    return { Authorization: `Bearer ${usuario.accessToken}` };
  }

  it('Cenário: Criar uma nova atividade', async () => {
    // Dado que estou autenticado
    // Quando eu crio uma atividade com nome "Estudar Inglês" e cor "#3366FF"
    const response = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Estudar Inglês', cor: '#3366FF' });

    expect(response.status).toBe(201);

    // Então a atividade "Estudar Inglês" deve aparecer na pool
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toEqual([expect.objectContaining({ nome: 'Estudar Inglês', cor: '#3366FF' })]);

    // E ela não deve estar alocada em nenhum dia ou horário
    const alocacoes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(alocacoes.body).toEqual([]);
  });

  it('Cenário: Editar nome e cor propaga para todos os clones', async () => {
    // Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    // E possui cor "#3366FF"
    const atividade = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Estudar Inglês', cor: '#3366FF' });
    const atividadeId = atividade.body.id;

    await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '19:00', duracaoMinutos: 60 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'sexta-feira', horaInicio: '19:00', duracaoMinutos: 60 })
      .expect(201);

    // Quando eu altero o nome da atividade para "Inglês - Duolingo"
    // E altero a cor da atividade para "#33FF81"
    await request(app.getHttpServer())
      .patch(`/atividades/${atividadeId}`)
      .set(autenticado())
      .send({ nome: 'Inglês - Duolingo', cor: '#33FF81' })
      .expect(200);

    // Então o nome e a cor devem ser atualizados na pool
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toEqual([expect.objectContaining({ nome: 'Inglês - Duolingo', cor: '#33FF81' })]);

    // E o nome e a cor devem ser atualizados em todas as alocações existentes dessa atividade
    const alocacoes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(alocacoes.body).toHaveLength(2);
    for (const alocacao of alocacoes.body) {
      expect(alocacao.atividade).toEqual(expect.objectContaining({ nome: 'Inglês - Duolingo', cor: '#33FF81' }));
    }
  });

  it('Cenário: Editar só a cor de uma atividade mantém o nome, inclusive na resposta', async () => {
    // Dado que a atividade "Estudar Inglês" possui cor "#3366FF"
    const atividade = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Estudar Inglês', cor: '#3366FF' });

    // Quando eu altero apenas a cor para "#33FF81"
    const resposta = await request(app.getHttpServer())
      .patch(`/atividades/${atividade.body.id}`)
      .set(autenticado())
      .send({ cor: '#33FF81' })
      .expect(200);

    // Então a atividade continua com o nome "Estudar Inglês" e passa a ter a
    // cor "#33FF81" — tanto na resposta do PATCH (o que o frontend usa na
    // tela) quanto na pool
    expect(resposta.body).toEqual({ id: atividade.body.id, nome: 'Estudar Inglês', cor: '#33FF81' });
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toEqual([{ id: atividade.body.id, nome: 'Estudar Inglês', cor: '#33FF81' }]);
  });

  it('Cenário: Editar dia, horário ou duração NÃO propaga entre clones', async () => {
    // Dado que a atividade "Estudar Inglês" possui uma alocação na segunda-feira das 19:00 às 20:00
    // E possui outra alocação na sexta-feira das 19:00 às 20:00
    const atividade = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Estudar Inglês', cor: '#3366FF' });
    const atividadeId = atividade.body.id;

    const segunda = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'segunda-feira', horaInicio: '19:00', duracaoMinutos: 60 });
    const sexta = await request(app.getHttpServer())
      .post('/alocacoes')
      .set(autenticado())
      .send({ atividadeId, diaSemana: 'sexta-feira', horaInicio: '19:00', duracaoMinutos: 60 });

    // Quando eu altero a alocação de sexta-feira para durar até as 21:00
    await request(app.getHttpServer())
      .patch(`/alocacoes/${sexta.body.id}`)
      .set(autenticado())
      .send({ duracaoMinutos: 120 })
      .expect(200);

    // Então a alocação de segunda-feira deve continuar das 19:00 às 20:00
    const segundaAtualizada = await request(app.getHttpServer())
      .get(`/alocacoes/${segunda.body.id}`)
      .set(autenticado());
    expect(segundaAtualizada.body).toEqual(
      expect.objectContaining({ horaInicio: '19:00', duracaoMinutos: 60 }),
    );

    // E o nome e a cor de ambas as alocações devem continuar iguais
    const sextaAtualizada = await request(app.getHttpServer())
      .get(`/alocacoes/${sexta.body.id}`)
      .set(autenticado());
    expect(segundaAtualizada.body.atividade).toEqual(sextaAtualizada.body.atividade);
  });

  it('Cenário: Excluir uma atividade pede confirmação e remove seus clones', async () => {
    // Confirmação é responsabilidade da UI (frontend); o backend só precisa
    // garantir a exclusão em cascata quando a exclusão é, de fato, chamada.
    //
    // Dado que a atividade "Trabalho" possui 3 alocações no calendário
    const atividade = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Trabalho', cor: '#000000' });
    const atividadeId = atividade.body.id;

    for (const diaSemana of ['segunda-feira', 'terca-feira', 'quarta-feira']) {
      await request(app.getHttpServer())
        .post('/alocacoes')
        .set(autenticado())
        .send({ atividadeId, diaSemana, horaInicio: '09:00', duracaoMinutos: 180 })
        .expect(201);
    }

    // Quando eu (confirmo e) excluo a atividade "Trabalho" da pool
    await request(app.getHttpServer()).delete(`/atividades/${atividadeId}`).set(autenticado()).expect(204);

    // Então as 3 alocações devem ser removidas do calendário
    const alocacoes = await request(app.getHttpServer()).get('/alocacoes').set(autenticado());
    expect(alocacoes.body).toEqual([]);

    // E a atividade não deve mais aparecer na pool
    const pool = await request(app.getHttpServer()).get('/atividades').set(autenticado());
    expect(pool.body).toEqual([]);
  });

  it('Cenário: Impedir duas atividades com o mesmo nome', async () => {
    // Dado que já existe uma atividade "Trabalho" na minha pool
    await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Trabalho', cor: '#000000' })
      .expect(201);

    // Quando eu tento criar outra atividade com nome "Trabalho"
    const segundaTentativa = await request(app.getHttpServer())
      .post('/atividades')
      .set(autenticado())
      .send({ nome: 'Trabalho', cor: '#FFFFFF' });

    // Então o sistema deve rejeitar a criação e avisar que já existe uma
    // atividade com esse nome
    expect(segundaTentativa.status).toBe(409);
  });
});
