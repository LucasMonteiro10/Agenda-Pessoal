import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createTestApp, startPostgresContainer } from './setup/test-app.js';

// Cenários Gherkin: docs/requisitos.md, Feature "Autenticação".
//
// "Deslogar um usuário autenticado" não tem teste aqui: com JWT sem estado
// no servidor, logout é só o frontend descartar o token guardado — não existe
// endpoint de backend para essa ação. O teste correspondente vive na suíte
// de frontend (Dia 3, parte 2).
describe('Autenticação (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;

  beforeAll(async () => {
    container = await startPostgresContainer();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('Cenário: Cadastro de novo usuário', async () => {
    // Quando eu me cadastro com email e senha válidos
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/registrar')
      .send({ email: `nova-conta-${randomUUID()}@teste.com`, senha: 'senha-forte-123' });

    // Então uma conta deve ser criada
    expect(registerResponse.status).toBe(201);
    // ...e a senha (nem o hash dela) nunca deve voltar na resposta.
    expect(registerResponse.body.senha).toBeUndefined();

    // E eu devo conseguir fazer login com essas credenciais
    const { email } = registerResponse.body;
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'senha-forte-123' });

    expect(loginResponse.status).toBe(200);
    expect(typeof loginResponse.body.accessToken).toBe('string');
  });

  it('Cenário: Login com credenciais válidas', async () => {
    // Dado que eu tenho uma conta cadastrada
    const email = `login-valido-${randomUUID()}@teste.com`;
    const senha = 'senha-forte-123';
    await request(app.getHttpServer()).post('/auth/registrar').send({ email, senha }).expect(201);

    // Quando eu informo email e senha corretos
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha });

    // Então eu devo ser autenticado...
    expect(loginResponse.status).toBe(200);
    expect(typeof loginResponse.body.accessToken).toBe('string');

    // ...e ver meu próprio cronograma (a rota fica acessível com o token).
    const atividadesResponse = await request(app.getHttpServer())
      .get('/atividades')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
    expect(atividadesResponse.status).toBe(200);
  });

  it('Cenário: Login com credenciais inválidas', async () => {
    // Dado que informo um email ou senha que não correspondem a nenhuma conta cadastrada
    // Quando eu tento fazer login
    const semContaResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `sem-conta-${randomUUID()}@teste.com`, senha: 'qualquer-coisa' });

    // Então eu devo receber uma mensagem alertando sobre email ou senha incorretos
    expect(semContaResponse.status).toBe(401);
    // E eu não devo ser autenticado
    expect(semContaResponse.body.accessToken).toBeUndefined();

    // Mesma verificação para o caso "conta existe, senha errada" — ambos os
    // casos devem responder de forma idêntica (não revelar qual dos dois
    // campos estava errado é uma prática de segurança básica).
    const email = `senha-errada-${randomUUID()}@teste.com`;
    await request(app.getHttpServer())
      .post('/auth/registrar')
      .send({ email, senha: 'senha-correta-123' })
      .expect(201);

    const senhaErradaResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'senha-errada-999' });

    expect(senhaErradaResponse.status).toBe(401);
    expect(senhaErradaResponse.body.accessToken).toBeUndefined();
  });

  it('Cenário: Isolamento de dados entre usuários', async () => {
    // Dado que existem dois usuários, A e B, cada um com atividades cadastradas
    const emailA = `usuario-a-${randomUUID()}@teste.com`;
    const emailB = `usuario-b-${randomUUID()}@teste.com`;
    const senha = 'senha-forte-123';

    await request(app.getHttpServer()).post('/auth/registrar').send({ email: emailA, senha }).expect(201);
    await request(app.getHttpServer()).post('/auth/registrar').send({ email: emailB, senha }).expect(201);

    const tokenA = (
      await request(app.getHttpServer()).post('/auth/login').send({ email: emailA, senha })
    ).body.accessToken;
    const tokenB = (
      await request(app.getHttpServer()).post('/auth/login').send({ email: emailB, senha })
    ).body.accessToken;

    await request(app.getHttpServer())
      .post('/atividades')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Atividade da Usuária A', cor: '#111111' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/atividades')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nome: 'Atividade do Usuário B', cor: '#222222' })
      .expect(201);

    // Quando o usuário A faz login (já fez acima) e busca seu cronograma
    const atividadesDeA = await request(app.getHttpServer())
      .get('/atividades')
      .set('Authorization', `Bearer ${tokenA}`);

    // Então ele deve ver apenas as atividades e alocações que ele criou
    expect(atividadesDeA.body).toHaveLength(1);
    expect(atividadesDeA.body[0].nome).toBe('Atividade da Usuária A');
  });
});
