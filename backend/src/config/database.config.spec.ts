import { ConfigService } from '@nestjs/config';
import { buildDatabaseConfig } from './database.config.js';
import { MIGRACOES } from './migracoes.js';

function configCom(variaveis: Record<string, string>) {
  return buildDatabaseConfig(new ConfigService(variaveis)) as Record<string, unknown>;
}

const DOCKER_LOCAL = {
  POSTGRES_HOST: 'postgres',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'agenda_user',
  POSTGRES_PASSWORD: 'senha',
  POSTGRES_DB: 'agenda',
};

// Motivação: CLAUDE.md, seção 7.26 — deploy na Vercel com o banco no Neon,
// sem quebrar o Docker local nem os testes com Testcontainers.
describe('buildDatabaseConfig', () => {
  it('com DATABASE_URL (Neon/Vercel), conecta pela URL com SSL', () => {
    const url = 'postgresql://usuario:senha@ep-exemplo.neon.tech/agenda?sslmode=require';

    const config = configCom({ ...DOCKER_LOCAL, DATABASE_URL: url });

    expect(config.url).toBe(url);
    expect(config.ssl).toBe(true);
    expect(config.host).toBeUndefined();
  });

  it('sem DATABASE_URL, usa host, porta, usuário, senha e banco (Docker local), sem SSL', () => {
    const config = configCom(DOCKER_LOCAL);

    expect(config).toMatchObject({
      host: 'postgres',
      port: 5432,
      username: 'agenda_user',
      password: 'senha',
      database: 'agenda',
    });
    expect(config.url).toBeUndefined();
    expect(config.ssl).toBeFalsy();
  });

  it('nunca sincroniza o schema sozinho — mudanças no banco passam por migrations', () => {
    expect(configCom(DOCKER_LOCAL).synchronize).toBe(false);
  });

  it('registra as migrations do projeto, mas não as executa na conexão (quem executa é executarMigracoes, com trava)', () => {
    const config = configCom(DOCKER_LOCAL);

    expect(config.migrations).toEqual(MIGRACOES);
    expect(MIGRACOES.length).toBeGreaterThan(0);
    expect(config.migrationsRun).toBe(false);
  });
});
