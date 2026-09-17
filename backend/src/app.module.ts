import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseConfig } from './config/database.config.js';
import { AuthModule } from './auth/auth.module.js';
import { AtividadesModule } from './atividades/atividades.module.js';
import { AlocacoesModule } from './alocacoes/alocacoes.module.js';

@Module({
  imports: [
    // '.env' cobre quando o backend roda dentro do Docker Compose (variáveis
    // já vêm do `environment:` do serviço, então o arquivo nem existe aí).
    // '../.env' cobre quando se roda localmente de dentro de `backend/`
    // (ex.: `npm run test:e2e`), reaproveitando o `.env` único na raiz do
    // repositório em vez de duplicar segredos em dois arquivos.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    AuthModule,
    AtividadesModule,
    AlocacoesModule,
  ],
})
export class AppModule {}
