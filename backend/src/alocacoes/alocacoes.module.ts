import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atividade } from '../atividades/entities/atividade.entity.js';
import { AlocacoesController } from './alocacoes.controller.js';
import { AlocacoesService } from './alocacoes.service.js';
import { Alocacao } from './entities/alocacao.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alocacao, Atividade]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AlocacoesController],
  providers: [AlocacoesService],
})
export class AlocacoesModule {}
