import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('POSTGRES_HOST'),
    port: config.get<number>('POSTGRES_PORT', 5432),
    username: config.getOrThrow<string>('POSTGRES_USER'),
    password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
    database: config.getOrThrow<string>('POSTGRES_DB'),
    autoLoadEntities: true,
    // Nunca usar em produção: aqui só ajuda no Dia 2/3 enquanto não há
    // migrations. A partir do Dia 4 as entidades passam a ter migrations
    // versionadas e isto deve virar `false`.
    synchronize: true,
  };
}
