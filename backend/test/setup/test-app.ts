import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

// Cada arquivo de spec sobe seu próprio Postgres efêmero via Testcontainers
// (decisão de stack em CLAUDE.md, seção 3). É mais lento que reusar um único
// container global, mas mantém cada Feature isolada e evita testes que
// "vazam" estado um para o outro.
export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();

  // A AppModule lê a config do banco via ConfigService (process.env) em
  // src/config/database.config.ts — então basta apontar essas variáveis para
  // o container efêmero antes de compilar o módulo de teste.
  process.env.POSTGRES_HOST = container.getHost();
  process.env.POSTGRES_PORT = String(container.getPort());
  process.env.POSTGRES_USER = container.getUsername();
  process.env.POSTGRES_PASSWORD = container.getPassword();
  process.env.POSTGRES_DB = container.getDatabase();

  return container;
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export interface UsuarioDeTeste {
  nomeCompleto: string;
  email: string;
  senha: string;
  accessToken: string;
}

// Helper para os specs de Atividade/Alocação: eles não testam Autenticação
// diretamente (isso é feito em autenticacao.e2e-spec.ts), só precisam de um
// usuário autenticado para poder chamar os endpoints protegidos.
export async function registrarEAutenticar(
  app: INestApplication,
  overrides: Partial<{ nomeCompleto: string; email: string; senha: string }> = {},
): Promise<UsuarioDeTeste> {
  const nomeCompleto = overrides.nomeCompleto ?? 'Usuária de Teste';
  const email = overrides.email ?? `usuario-${randomUUID()}@teste.com`;
  const senha = overrides.senha ?? 'senha-forte-123';

  await request(app.getHttpServer()).post('/auth/registrar').send({ nomeCompleto, email, senha }).expect(201);

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, senha })
    .expect(200);

  return { nomeCompleto, email, senha, accessToken: loginResponse.body.accessToken as string };
}
