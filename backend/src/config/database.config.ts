import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MIGRACOES } from './migracoes.js';

export function buildDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  // Mudanças de schema só por migrations (src/migrations), executadas na
  // inicialização por executarMigracoes — ver
  // ExecutarMigracoesNaInicializacao. Nunca `synchronize`: ele altera o
  // banco para bater com as entidades e pode apagar colunas com dados.
  const comum = {
    type: 'postgres' as const,
    autoLoadEntities: true,
    synchronize: false,
    migrations: MIGRACOES,
    migrationsRun: false,
  };

  // Neon (integração da Vercel): uma URL única, e a conexão exige SSL.
  const url = config.get<string>('DATABASE_URL');
  if (url) {
    return { ...comum, url, ssl: true };
  }

  // Docker local e testes (Testcontainers): credenciais separadas, sem SSL.
  return {
    ...comum,
    host: config.getOrThrow<string>('POSTGRES_HOST'),
    port: Number(config.get('POSTGRES_PORT', 5432)),
    username: config.getOrThrow<string>('POSTGRES_USER'),
    password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
    database: config.getOrThrow<string>('POSTGRES_DB'),
  };
}
